from fastapi import APIRouter, Depends, HTTPException, status
import google.oauth2.credentials
import googleapiclient.discovery
# google.auth.transport.requests handled by dependency
from pydantic import BaseModel, EmailStr
import base64
from email.mime.text import MIMEText

from ..main import User, get_current_user, google_user_tokens_db, credentials_to_dict, get_refreshed_google_credentials # Added dependency

router = APIRouter(
    prefix="/gmail",
    tags=["gmail"],
)

GMAIL_API_SERVICE_NAME = 'gmail'
GMAIL_API_VERSION = 'v1'

@router.get("/inbox")
async def list_inbox_messages(
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials),
    max_results: int = 10
):
    # Remove duplicated refresh logic
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        results = gmail_service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=max_results).execute()
        messages_summary = results.get('messages', [])
        detailed_messages = []
        if messages_summary:
            # Simplified fetch (batching recommended for production)
            for msg_summary in messages_summary[:max_results]:
                msg_detail = gmail_service.users().messages().get(userId='me', id=msg_summary['id'], format='metadata', metadataHeaders=['Subject', 'From', 'Date']).execute()
                headers = msg_detail.get('payload', {}).get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'N/A')
                from_sender = next((h['value'] for h in headers if h['name'] == 'From'), 'N/A')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'N/A')
                detailed_messages.append({
                    'id': msg_detail['id'], 'threadId': msg_detail['threadId'], 'snippet': msg_detail['snippet'],
                    'subject': subject, 'from': from_sender, 'date': date
                })
        return {"messages": detailed_messages, "resultSizeEstimate": results.get('resultSizeEstimate')}
    except Exception as e:
        print(f"Google Gmail API error (inbox): {e}")
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