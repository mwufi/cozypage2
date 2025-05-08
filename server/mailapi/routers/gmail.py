from fastapi import APIRouter, Depends, HTTPException, status, Query
import google.oauth2.credentials
import googleapiclient.discovery
# google.auth.transport.requests handled by dependency
from pydantic import BaseModel, EmailStr
import base64
from email.mime.text import MIMEText
from typing import List, Optional # For List in query parameters

from ..main import User, get_current_user, credentials_to_dict, get_refreshed_google_credentials # Added dependency

router = APIRouter(
    prefix="/gmail",
    tags=["gmail"],
)

GMAIL_API_SERVICE_NAME = 'gmail'
GMAIL_API_VERSION = 'v1'

@router.get("/messages")
async def list_messages(
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials),
    label_ids: Optional[List[str]] = Query(["INBOX"]), # Default to INBOX, allow multiple
    max_results: int = Query(25, ge=1, le=100) # Default 25, with validation
):
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        # Use label_ids from query parameter. If empty or None, Gmail API defaults to all messages (excluding TRASH and SPAM usually)
        # For our purpose, we ensured it defaults to ["INBOX"] via Query() if not provided.
        list_query = gmail_service.users().messages().list(userId='me', maxResults=max_results)
        if label_ids:
            list_query = gmail_service.users().messages().list(userId='me', labelIds=label_ids, maxResults=max_results)
        else: # If label_ids is explicitly empty or None after Query default, list all (or stick to INBOX)
            list_query = gmail_service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=max_results) # Or remove labelIds to get all mail
            
        results = list_query.execute()
        messages_summary = results.get('messages', [])
        detailed_messages = []

        if messages_summary:
            batch = gmail_service.new_batch_http_request(callback=lambda id, response, exception: None) # Dummy callback initially
            message_details_map = {} # To store results keyed by message id

            def _create_callback(msg_id):
                def callback(request_id, response, exception):
                    if exception:
                        # Handle exception for this specific request, e.g., log it
                        print(f"Error fetching message {msg_id}: {exception}")
                        message_details_map[msg_id] = {"error": str(exception)}
                    else:
                        headers = response.get('payload', {}).get('headers', [])
                        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'N/A')
                        from_sender = next((h['value'] for h in headers if h['name'] == 'From'), 'N/A')
                        date = next((h['value'] for h in headers if h['name'] == 'Date'), 'N/A')
                        message_details_map[msg_id] = {
                            'id': response['id'], 'threadId': response['threadId'], 'snippet': response['snippet'],
                            'subject': subject, 'from': from_sender, 'date': date
                        }
                return callback

            for msg_summary in messages_summary: # Iterate through all summaries fetched
                msg_id = msg_summary['id']
                batch.add(
                    gmail_service.users().messages().get(userId='me', id=msg_id, format='metadata', metadataHeaders=['Subject', 'From', 'Date']),
                    callback=_create_callback(msg_id)
                )
            
            await gmail_service._client.loop.run_in_executor(None, batch.execute) # Run batch request

            # Reconstruct detailed_messages in order
            for msg_summary in messages_summary:
                detail = message_details_map.get(msg_summary['id'])
                if detail and not detail.get("error"):
                    detailed_messages.append(detail)
        
        return {"messages": detailed_messages, "resultSizeEstimate": results.get('resultSizeEstimate'), "labelIdsApplied": label_ids}
    except Exception as e:
        print(f"Google Gmail API error (messages): {e}")
        if "insufficient permissions" in str(e).lower() or "access an unauthorized Scribe service" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for Gmail.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Gmail: {str(e)}")

@router.get("/labels")
async def list_gmail_labels(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    # Remove duplicated refresh logic
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        results = gmail_service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        return {"labels": labels}
    except Exception as e:
        print(f"Google Gmail API error (labels): {e}")
        if "insufficient permissions" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for Gmail labels.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Gmail labels: {str(e)}")

# Pydantic schema remains the same
class DraftEmailSchema(BaseModel):
    to: EmailStr
    subject: str
    body: str

@router.post("/drafts", status_code=status.HTTP_201_CREATED)
async def create_gmail_draft(
    email_data: DraftEmailSchema,
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials) # Use dependency
):
    # Remove duplicated refresh logic
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        message = MIMEText(email_data.body)
        message['to'] = email_data.to
        message['subject'] = email_data.subject
        raw_message_bytes = message.as_bytes()
        raw_message_b64 = base64.urlsafe_b64encode(raw_message_bytes).decode('utf-8')
        body = {'message': {'raw': raw_message_b64}}
        draft = gmail_service.users().drafts().create(userId='me', body=body).execute()
        return {
            "message": "Draft created successfully!", "id": draft.get('id'),
            "messageId": draft.get('message', {}).get('id')
        }
    except Exception as e:
        print(f"Google Gmail API error (create draft): {e}")
        if "insufficient permissions" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create Gmail draft.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not create Gmail draft: {str(e)}") 