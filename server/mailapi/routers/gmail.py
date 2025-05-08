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
import re # For word splitting
from datetime import datetime # For date formatting in quote

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
        # 1. Fetch the original message - use format='full' or 'metadata' + snippet
        # format='metadata' includes the snippet which is often sufficient
        original_message = gmail_service.users().messages().get(userId='me', id=original_message_id, format='metadata').execute()
        original_headers = original_message.get('payload', {}).get('headers', [])
        original_thread_id = original_message.get('threadId')
        original_snippet = original_message.get('snippet', '')

        # 2. Extract necessary headers from the original message
        original_subject = next((h['value'] for h in original_headers if h['name'].lower() == 'subject'), "")
        original_from_header = next((h['value'] for h in original_headers if h['name'].lower() == 'from'), "")
        original_message_id_header = next((h['value'] for h in original_headers if h['name'].lower() == 'message-id'), None)
        original_references_header = next((h['value'] for h in original_headers if h['name'].lower() == 'references'), None)

        # 3. Determine reply recipient(s)
        # Prefer Reply-To header if it exists
        reply_to_header = next((h['value'] for h in original_headers if h['name'].lower() == 'reply-to'), None)
        reply_to_email = reply_to_header if reply_to_header else original_from_header
        
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

        # 6. Create the reply body with the first 10 words
        
        # Extract first 10 words from snippet
        words = re.split(r'\s+', original_snippet.strip()) # Split by whitespace
        first_10_words = " ".join(words[:10])
        if len(words) > 10:
             first_10_words += "..."

        # Format the reply body
        reply_body_text = f"the first 10 words of this are <{first_10_words}>\n\n"
        
        # Optional: Add quoting block below
        # parsed_from = parseaddr(original_from_header)
        # original_date_str = next((h['value'] for h in original_headers if h['name'].lower() == 'date'), None)
        # if original_date_str:
        #     reply_body_text += f"\n\nOn {original_date_str}, {parsed_from[0] or parsed_from[1]} wrote:\n> {original_snippet}\n"
        # else: # Fallback if Date header not found
        #     reply_body_text += f"\n\n{parsed_from[0] or parsed_from[1]} wrote:\n> {original_snippet}\n"

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

# New Pydantic model for enriched thread list item
class EnrichedThread(BaseModel):
    id: str
    snippet: str
    historyId: str
    # Added fields from latest message
    latest_message_subject: Optional[str] = None
    latest_message_from: Optional[str] = None
    latest_message_date: Optional[str] = None # Store as string for simplicity, frontend can parse
    # latest_message_timestamp: Optional[int] = None # Or store timestamp
    # message_count: Optional[int] = None # threads.get needed for reliable count
    # has_draft: Optional[bool] = None # Requires separate check

class EnrichedThreadsListResponse(BaseModel):
    threads: List[EnrichedThread]
    nextPageToken: Optional[str] = None
    resultSizeEstimate: Optional[int] = None
    labelIdsApplied: Optional[List[str]] = None

@router.get("/threads", response_model=EnrichedThreadsListResponse)
async def list_threads(
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials),
    label_ids: Optional[List[str]] = Query(None), 
    max_results: int = Query(25, ge=1, le=100),
    page_token: Optional[str] = Query(None)
):
    """Lists threads with enriched data for the latest message."""
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        thread_list_query = gmail_service.users().threads().list(
            userId='me',
            maxResults=max_results,
            pageToken=page_token,
            labelIds=label_ids 
        )
        results = await run_in_threadpool(thread_list_query.execute)
        
        basic_threads = results.get('threads', [])
        next_page_token = results.get('nextPageToken')
        result_size_estimate = results.get('resultSizeEstimate')

        enriched_threads = []
        if basic_threads:
            # Prepare batch request to get metadata for the latest message of each thread
            batch = gmail_service.new_batch_http_request()
            latest_message_data_map = {}

            def _create_thread_get_callback(thread_id):
                def callback(request_id, response, exception):
                    if exception:
                        print(f"Error fetching thread details for {thread_id} during list enrichment: {exception}")
                        # Store error or empty data? Decide on error handling for enrichment.
                        latest_message_data_map[thread_id] = {'error': True}
                    else:
                        # Get the *last* message from the thread's message list
                        last_message = response.get('messages', [])[-1] if response.get('messages') else None
                        if last_message and last_message.get('payload'):
                            headers = last_message.get('payload', {}).get('headers', [])
                            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
                            from_sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
                            date_str = next((h['value'] for h in headers if h['name'].lower() == 'date'), last_message.get('internalDate')) # Use Date header or internalDate
                            latest_message_data_map[thread_id] = {
                                'latest_message_subject': subject,
                                'latest_message_from': from_sender,
                                'latest_message_date': date_str,
                            }
                        else:
                             latest_message_data_map[thread_id] = {} # No messages or payload found
                return callback

            for thread in basic_threads:
                thread_id = thread['id']
                # Request only metadata for the latest message - but threads.get requires fetching all messages metadata.
                # There isn't a direct way to get ONLY the latest message easily with threads.get.
                # Alternative: Use messages.list(threadId=thread_id, maxResults=1) - potentially faster?
                # Let's stick to threads.get(format='metadata') for now, it gives all message headers.
                batch.add(
                    gmail_service.users().threads().get(userId='me', id=thread_id, format='metadata'),
                    callback=_create_thread_get_callback(thread_id)
                )
            
            await run_in_threadpool(batch.execute) # Execute batch fetch for thread metadata

            # Combine basic thread info with enriched data
            for thread in basic_threads:
                thread_id = thread['id']
                enriched_data = latest_message_data_map.get(thread_id, {})
                enriched_threads.append(EnrichedThread(
                    id=thread_id,
                    snippet=thread.get('snippet', ''),
                    historyId=thread.get('historyId', ''),
                    **enriched_data # Add subject, from, date if found
                ))
        
        return EnrichedThreadsListResponse(
            threads=enriched_threads,
            nextPageToken=next_page_token,
            resultSizeEstimate=result_size_estimate,
            labelIdsApplied=label_ids
        )

    except Exception as e:
        print(f"Google Gmail API error (list threads enriched): {e}")
        # ... (existing error handling) ...
        if "insufficient permissions" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for Gmail.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error listing Gmail threads: {str(e)}")

@router.get("/threads/{thread_id}")
async def get_thread_detail(
    thread_id: str,
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)
    # Optional: Add query params for message format etc. if needed later
):
    """Gets the full details of a thread, including its messages and associated drafts."""
    gmail_service = googleapiclient.discovery.build(GMAIL_API_SERVICE_NAME, GMAIL_API_VERSION, credentials=credentials)
    try:
        # 1. Get messages in the thread
        thread_get_query = gmail_service.users().threads().get(
            userId='me', 
            id=thread_id, 
            format='full' # Request full message details including payload (for body)
        )
        thread_data = await run_in_threadpool(thread_get_query.execute)
        messages = thread_data.get('messages', [])

        # 2. Find drafts associated with this thread
        drafts = []
        try:
            drafts_list_query = gmail_service.users().drafts().list(
                userId='me',
                # Use q parameter to filter drafts by threadId. 
                # Note: This relies on the draft having the correct threadId set, 
                # which our create_draft_reply function does.
                q=f'in:draft thread:{thread_id}'
            )
            draft_results = await run_in_threadpool(drafts_list_query.execute)
            draft_summaries = draft_results.get('drafts', [])
            
            # If drafts are found, fetch their full details (especially the message part)
            if draft_summaries:
                 # Use batching for efficiency if multiple drafts per thread were possible (less common)
                 # For simplicity now, fetch one by one if needed, or just return summary + ID
                 # Fetching full draft details can be complex as it might involve another message get.
                 # Let's return the draft summaries which include the draft ID and a nested (minimal) message stub.
                 # The frontend can potentially fetch full draft message details separately if needed using the message ID.
                 drafts = draft_summaries # Contains { id: draftId, message: { id: messageId, threadId: ... } }

        except Exception as draft_error:
             # Log the error but don't fail the whole request if drafts can't be fetched
             print(f"Warning: Could not fetch drafts for thread {thread_id}: {draft_error}")

        # 3. Combine and return
        # The main thread_data already contains the list of messages.
        # We add the fetched drafts list to it.
        thread_data['drafts'] = drafts 

        return thread_data

    except googleapiclient.errors.HttpError as e:
        if e.resp.status == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Thread with ID {thread_id} not found.")
        print(f"Google Gmail API error (get thread {thread_id}): {e}")
        # ... (other error handling as in get_message_detail)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Gmail thread: {str(e)}")
    except Exception as e:
        print(f"General error getting thread {thread_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}") 