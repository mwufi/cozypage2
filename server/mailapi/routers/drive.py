from fastapi import APIRouter, Depends, HTTPException, status
import google.oauth2.credentials
import googleapiclient.discovery
# google.auth.transport.requests is now handled by the dependency
from datetime import datetime

# Adjust import path based on your project structure
from ..main import get_refreshed_google_credentials # Added get_refreshed_google_credentials

router = APIRouter(
    prefix="/drive",
    tags=["drive"],
)

DRIVE_API_SERVICE_NAME = 'drive'
DRIVE_API_VERSION = 'v2'

@router.get("/")
async def list_drive_files(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    # No need to get user_email or tokens here, credentials dependency handles it
    # Remove duplicated refresh logic:
    # user_email = current_user.email
    # user_google_tokens = google_user_tokens_db.get(user_email)
    # ... (if not user_google_tokens ...)
    # credentials = google.oauth2.credentials.Credentials(**user_google_tokens)
    # ... (if credentials.expired ...) ...

    drive_service = googleapiclient.discovery.build(
        DRIVE_API_SERVICE_NAME, DRIVE_API_VERSION, credentials=credentials
    )
    try:
        files = drive_service.files().list().execute()
        return files
    except Exception as e:
        user_email = "unknown" # We might not have user context easily here, log appropriately
        # Consider passing current_user if you need email for logging
        print(f"Google Drive API error for authenticated user: {e}") 
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             # This specific error should ideally be caught by the refresh dependency, 
             # but catching again provides defense in depth or covers non-refresh related auth issues.
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Google Drive: {str(e)}")

@router.post("/create_doc", status_code=status.HTTP_201_CREATED)
async def create_google_doc(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    # Remove duplicated refresh logic

    drive_service = googleapiclient.discovery.build(DRIVE_API_SERVICE_NAME, DRIVE_API_VERSION, credentials=credentials)
    
    doc_title = f"New Doc created by App - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
    file_metadata = {
        'title': doc_title,
        'mimeType': 'application/vnd.google-apps.document'
    }

    try:
        created_file = drive_service.files().insert(body=file_metadata).execute()
        return {
            "message": "Google Doc created successfully!", 
            "id": created_file.get('id'),
            "title": created_file.get('title'),
            "link": created_file.get('alternateLink')
        }
    except Exception as e:
        print(f"Error creating Google Doc for authenticated user: {e}")
        if "insufficient permissions" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create Google Doc. Ensure 'drive.file' scope was granted.")
        # Handle potential 401 again just in case
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked during API call. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not create Google Doc: {str(e)}") 