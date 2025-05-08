from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.concurrency import run_in_threadpool # Import run_in_threadpool
import google.oauth2.credentials
import googleapiclient.discovery
# google.auth.transport.requests handled by dependency
from pydantic import BaseModel, EmailStr
import base64
from email.mime.text import MIMEText
from typing import List, Optional # For List in query parameters
from email.utils import formataddr, parseaddr # For parsing and formatting email addresses

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
            
            await run_in_threadpool(batch.execute)

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

@router.get("/messages/{message_id}")
async def get_message_detail(
    message_id: str,
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials),
    # format_type: str = Query("full", enum=["full", "minimal", "raw", "metadata"]) # Optional: Allow specifying format
):
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        # Using format='full' to get most details including body parts
        # Consider what parts of the message are needed for display to optimize
        message = gmail_service.users().messages().get(userId='me', id=message_id, format='full').execute()
        return message
    except googleapiclient.errors.HttpError as e:
        if e.resp.status == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Message with ID {message_id} not found.")
        print(f"Google Gmail API error (get message {message_id}): {e}")
        if "insufficient permissions" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for Gmail.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Gmail message: {str(e)}")
    except Exception as e:
        print(f"General error getting message {message_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")

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

@router.post("/drafts/create_blank", status_code=status.HTTP_201_CREATED)
async def create_blank_gmail_draft(
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)
):
    """Creates a new, blank draft message."""
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        # Create a minimal, valid raw RFC 822 message string.
        # An empty subject and body is usually sufficient for a "blank" draft.
        # The Gmail API requires the 'raw' field to be base64url encoded.
        empty_email_content = "Subject: \n\n"
        raw_message_bytes = empty_email_content.encode('utf-8')
        raw_message_b64url = base64.urlsafe_b64encode(raw_message_bytes).decode('utf-8')

        message_body_for_api = {
            'message': {
                'raw': raw_message_b64url
            }
        }
        
        draft = gmail_service.users().drafts().create(userId='me', body=message_body_for_api).execute()
        return {
            "message": "Blank draft created successfully!", 
            "id": draft.get('id'),
            "messageId": draft.get('message', {}).get('id')
        }
    except Exception as e:
        print(f"Google Gmail API error (create blank draft): {e}")
        if "insufficient permissions" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create Gmail draft.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not create blank Gmail draft: {str(e)}")

class DraftReplySchema(BaseModel):
    original_message_id: str
    # Optional: quote_original: bool = True # If we want to control quoting

@router.post("/drafts/reply", status_code=status.HTTP_201_CREATED)
async def create_draft_reply(
    reply_data: DraftReplySchema,
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)
):
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    original_message_id = reply_data.original_message_id

    try:
        # 1. Fetch the original message to get headers and threadId
        original_message = gmail_service.users().messages().get(userId='me', id=original_message_id, format='metadata').execute()
        original_headers = original_message.get('payload', {}).get('headers', [])
        original_thread_id = original_message.get('threadId')

        # 2. Extract necessary headers from the original message
        original_subject = next((h['value'] for h in original_headers if h['name'].lower() == 'subject'), "")
        original_from_header = next((h['value'] for h in original_headers if h['name'].lower() == 'from'), "")
        original_to_header = next((h['value'] for h in original_headers if h['name'].lower() == 'to'), "")
        original_cc_header = next((h['value'] for h in original_headers if h['name'].lower() == 'cc'), "")
        original_message_id_header = next((h['value'] for h in original_headers if h['name'].lower() == 'message-id'), None)
        original_references_header = next((h['value'] for h in original_headers if h['name'].lower() == 'references'), None)

        # 3. Determine reply recipient(s)
        # Prefer Reply-To header if it exists
        reply_to_header = next((h['value'] for h in original_headers if h['name'].lower() == 'reply-to'), None)
        if reply_to_header:
            reply_to_email = reply_to_header
        else:
            # Otherwise, reply to the From address
            reply_to_email = original_from_header
        
        # For a simple reply, the To field of the new draft is the From (or Reply-To) of the original.
        # We won't auto-fill CC or BCC for a simple reply for now.

        # 4. Construct the reply subject
        reply_subject = original_subject
        if not reply_subject.lower().startswith("re:"):
            reply_subject = f"Re: {original_subject}"

        # 5. Construct In-Reply-To and References headers
        # These are crucial for threading.
        in_reply_to = original_message_id_header
        references = original_references_header
        if references:
            if original_message_id_header:
                references = f"{references} {original_message_id_header}"
        elif original_message_id_header:
            references = original_message_id_header

        # 6. Create the MIME message for the draft body (initially blank or with a quote)
        # For now, a blank body. Quoting can be added later.
        reply_body_text = "\n\n" # Start with a blank body
        # Example for basic quoting (can be much more sophisticated):
        # parsed_from = parseaddr(original_from_header)
        # parsed_date = original_message.get('internalDate') # internalDate is timestamp in ms
        # if parsed_date:
        #     original_date_str = datetime.fromtimestamp(int(parsed_date)/1000).strftime('%a, %b %d, %Y at %I:%M %p')
        #     reply_body_text += f"\n\nOn {original_date_str}, {parsed_from[1]} wrote:\n> ...original message snippet...\n"
        
        mime_message = MIMEText(reply_body_text)
        mime_message['to'] = reply_to_email
        mime_message['subject'] = reply_subject
        if in_reply_to:
            mime_message['In-Reply-To'] = in_reply_to
        if references:
            mime_message['References'] = references
        
        # The user's email will be automatically set as From by Gmail

        raw_message_bytes = mime_message.as_bytes()
        raw_message_b64url = base64.urlsafe_b64encode(raw_message_bytes).decode('utf-8')

        # 7. Create the draft using the Gmail API
        draft_body_for_api = {
            'message': {
                'raw': raw_message_b64url,
                'threadId': original_thread_id # Ensure the draft is part of the same thread
            }
        }

        created_draft = gmail_service.users().drafts().create(userId='me', body=draft_body_for_api).execute()

        return {
            "message": "Reply draft created successfully!",
            "id": created_draft.get('id'),
            "messageId": created_draft.get('message', {}).get('id'),
            "threadId": original_thread_id
        }

    except googleapiclient.errors.HttpError as e:
        if e.resp.status == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Original message with ID {original_message_id} not found.")
        # ... (other specific HttpError handling) ...
        print(f"Google Gmail API error (create reply draft for {original_message_id}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating reply draft: {str(e)}")
    except Exception as e:
        print(f"General error creating reply draft for {original_message_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}") 