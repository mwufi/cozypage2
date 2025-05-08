import os
import jwt # For JWT
from datetime import datetime, timedelta # For JWT expiry
from typing import Dict, Optional, List

from fastapi import FastAPI, Request, Depends, HTTPException, status, Response as FastAPIResponse # Added Response
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, HTTPAuthorizationCredentials, HTTPBearer # For JWT validation
from pydantic import BaseModel
import requests
import uvicorn
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery
import google.auth.transport.requests # Added for token refresh consistency

# --- Database Imports --- 
from sqlalchemy.ext.asyncio import AsyncSession
from .database import engine, Base, get_db, create_db_and_tables # Import DB components
from .models import UserGoogleToken # Import the model
# --- End Database Imports ---

# OAuth2 configuration
CLIENT_SECRETS_FILE = "server/mailapi/client_secret.json"
SCOPES = [
    'openid', # Add openid scope
    'https://www.googleapis.com/auth/userinfo.email', # Request email to identify user
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose' # Scope for creating drafts and sending mail
]
DRIVE_API_SERVICE_NAME = 'drive'
DRIVE_API_VERSION = 'v2'
CALENDAR_API_SERVICE_NAME = 'calendar'
CALENDAR_API_VERSION = 'v3'

# JWT Settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-please-change") # Load from env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day, for example

# Environment-dependent URLs
FRONTEND_APP_URL = os.getenv("FRONTEND_APP_URL", "http://localhost:3000")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

# CORS origins - adjust as needed for production
origins = [
    "http://localhost:3000",  # Assuming Next.js runs on port 3000
    "http://localhost:8000",  # For the FastAPI app itself if it makes requests to itself
]

app = FastAPI(title="Mail API with Google OAuth and JWT - Refactored")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", FRONTEND_APP_URL, "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET_KEY", "your-session-secret-key-please-change")
)

class CredentialsModel(BaseModel):
    token: str
    refresh_token: Optional[str] = None
    token_uri: str
    client_id: str
    client_secret: str
    granted_scopes: List[str] = []

class FeaturesModel(BaseModel):
    drive: bool
    calendar: bool

class TokenData(BaseModel):
    user_email: Optional[str] = None

class User(BaseModel):
    email: str
    # Add other user fields if needed

# JWT Utilities
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_email: Optional[str] = payload.get("sub")
        if user_email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials - user_email missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Here you could add a DB lookup if you want to ensure the user exists in your system beyond JWT
        # For now, just returning the User based on JWT email claim
        return User(email=user_email)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        print(f"JWT Error: {e}") # Log the specific JWT error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials - JWT error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- Dependency to get valid Google Credentials (handles refresh) ---
async def get_refreshed_google_credentials(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db) # Inject DB session
) -> google.oauth2.credentials.Credentials:
    user_email = current_user.email
    # Retrieve tokens from DB
    db_token_entry = await db.get(UserGoogleToken, user_email)

    if not db_token_entry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User Google tokens not found in DB. Please re-authenticate."
        )
    
    user_google_tokens = db_token_entry.to_dict() # Convert model to dict for Credentials class
    credentials = google.oauth2.credentials.Credentials(**user_google_tokens)
    
    if credentials.expired and credentials.refresh_token:
        print(f"Google token expired for {user_email}, attempting refresh...")
        try:
            request_object = google.auth.transport.requests.Request()
            credentials.refresh(request_object)
            # Update the stored tokens in DB with the refreshed ones
            refreshed_token_data = credentials_to_dict(credentials)
            for key, value in refreshed_token_data.items():
                setattr(db_token_entry, key, value)
            await db.commit()
            await db.refresh(db_token_entry)
            print(f"Successfully refreshed Google token for {user_email} in DB")
        except google.auth.exceptions.RefreshError as e:
            print(f"Failed to refresh Google token for {user_email}: {e}")
            # Potentially clear tokens from DB if refresh fails permanently
            # await db.delete(db_token_entry)
            # await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail=f"Failed to refresh Google token ({e}). Please re-authenticate."
            )
    elif credentials.expired and not credentials.refresh_token:
        # Token expired, but no refresh token available
        print(f"Google token expired for {user_email}, but no refresh token found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session expired, and no refresh token available. Please re-authenticate."
        )
        
    # Check if the token is still valid after potential refresh attempt or if it wasn't expired
    if not credentials.valid:
         # This case might occur if the token was near expiry but refresh failed for non-exception reason, or clock skew
         print(f"Google token is invalid for {user_email} even after refresh check.")
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials. Please re-authenticate."
         )

    return credentials

def get_google_flow(state: Optional[str] = None) -> google_auth_oauthlib.flow.Flow:
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, 
        scopes=SCOPES,
        state=state
    )
    flow.redirect_uri = f"{BACKEND_BASE_URL}/auth/google/callback" # Crucial: Google redirects here
    return flow

@app.get("/auth/google/login")
async def auth_google_login(request: Request):
    flow = get_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline", 
        include_granted_scopes="true",
        prompt="consent" # Force consent screen for refresh token if needed
    )
    request.session["oauth_state"] = state # Store state in session
    return RedirectResponse(authorization_url)

@app.get("/auth/google/callback")
async def auth_google_callback(request: Request, code: str, state: str, db: AsyncSession = Depends(get_db)):
    stored_state = request.session.pop("oauth_state", None)
    if not stored_state or stored_state != state:
        return JSONResponse({"error": "State mismatch"}, status_code=status.HTTP_400_BAD_REQUEST)

    flow = get_google_flow(state=state)
    try:
        flow.fetch_token(code=code)
    except Exception as e:
        print(f"Error fetching Google token: {e}")
        return JSONResponse({"error": "Failed to fetch Google token"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    credentials = flow.credentials
    
    userinfo_service = googleapiclient.discovery.build("oauth2", "v2", credentials=credentials)
    user_info = userinfo_service.userinfo().get().execute()
    user_email = user_info.get("email")

    if not user_email:
        return JSONResponse({"error": "Could not retrieve user email from Google"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Store/Update Google tokens in the database
    token_data_dict = credentials_to_dict(credentials)
    db_token_entry = await db.get(UserGoogleToken, user_email)
    if db_token_entry:
        # Update existing entry
        for key, value in token_data_dict.items():
            setattr(db_token_entry, key, value)
        print(f"Updating Google tokens for {user_email} in DB.")
    else:
        # Create new entry
        db_token_entry = UserGoogleToken(user_email=user_email, **token_data_dict)
        db.add(db_token_entry)
        print(f"Storing new Google tokens for {user_email} in DB.")
    
    await db.commit() # Commit the session here to save changes to DB
    await db.refresh(db_token_entry) # Refresh to get any DB-generated fields (not applicable here but good practice)

    # Create JWT for our frontend
    jwt_payload = {"sub": user_email}
    app_jwt = create_access_token(data=jwt_payload)

    frontend_callback_url = f"{FRONTEND_APP_URL}/auth/callback?jwt={app_jwt}"
    return RedirectResponse(frontend_callback_url)

@app.post("/auth/refresh_token")
async def auth_refresh_google_token(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """ Manually trigger a refresh of the user's Google OAuth token. """
    user_email = current_user.email
    db_token_entry = await db.get(UserGoogleToken, user_email)

    if not db_token_entry:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User Google tokens not found in DB. Cannot refresh.")
    
    user_google_tokens = db_token_entry.to_dict()
    if not user_google_tokens.get('refresh_token'):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No refresh token available for this user. Re-authentication required.")

    credentials = google.oauth2.credentials.Credentials(**user_google_tokens)
    
    try:
        request_object = google.auth.transport.requests.Request()
        credentials.refresh(request_object)
        # Update the stored tokens in DB
        refreshed_token_data = credentials_to_dict(credentials)
        for key, value in refreshed_token_data.items():
            setattr(db_token_entry, key, value)
        await db.commit()
        await db.refresh(db_token_entry)
        print(f"Successfully refreshed Google token for {user_email} in DB via manual refresh endpoint")
        return {"message": f"Google token refreshed successfully for {user_email}", "new_expiry": credentials.expiry.isoformat() }
    except Exception as e:
        print(f"Error explicitly refreshing Google token for {user_email}: {e}")
        if "invalid_grant" in str(e).lower():
            # await db.delete(db_token_entry) # Consider if token should be deleted
            # await db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to refresh Google token: {str(e)}")

@app.get("/drive")
async def drive_api_request(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    drive = googleapiclient.discovery.build(
        DRIVE_API_SERVICE_NAME, DRIVE_API_VERSION, credentials=credentials
    )
    try:
        files = drive.files().list().execute()
        return files
    except Exception as e:
        print(f"Google Drive API error: {e}")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Google Drive: {str(e)}")

@app.get("/calendar")
async def calendar_api_request(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    calendar = googleapiclient.discovery.build(
        CALENDAR_API_SERVICE_NAME, CALENDAR_API_VERSION, credentials=credentials
    )
    try:
        calendar_list = calendar.calendarList().list().execute()
        return calendar_list
    except Exception as e:
        print(f"Google Calendar API error: {e}")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Google Calendar: {str(e)}")

def credentials_to_dict(credentials):
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

@app.get("/", response_class=HTMLResponse)
async def root_info():
    # Simple page, or redirect to frontend, or provide API docs link
    return HTMLResponse(
        """<html><body><h1>FastAPI Google Auth Backend - Refactored</h1>
        <p><a href=\"/auth/google/login\">Login with Google (Test Backend Flow)</a></p>
        <p>Access protected APIs like /drive or /calendar with a Bearer JWT.</p>
        <p>Current Scopes: """ + ", ".join(SCOPES) + """</p>
        </body></html>"""
    )

# --- Import and Include Routers ---
from .routers import drive as drive_router
from .routers import calendar as calendar_router
from .routers import gmail as gmail_router # Add Gmail router

app.include_router(drive_router.router)
app.include_router(calendar_router.router)
app.include_router(gmail_router.router) # Include Gmail router

# --- Main Execution Block (Removed uvicorn.run) --- 
# The application should be run using: uvicorn server.mailapi.main:app --reload
# from the workspace root directory.
if __name__ == "__main__":
    # You can leave configuration checks or print statements here if desired,
    # but don't run the server from here directly for package imports to work reliably.
    print("Starting FastAPI server setup (run with uvicorn command)...")
    print(f"JWT_SECRET_KEY: {JWT_SECRET_KEY[:10]}... (ensure this is set securely in prod)")
    print(f"FRONTEND_APP_URL: {FRONTEND_APP_URL}")
    print(f"BACKEND_BASE_URL: {BACKEND_BASE_URL}")
    # os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1" # Set these via env vars or command line if needed
    # os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
    pass # Keep the block if you want the prints, otherwise remove entirely.

@app.on_event("startup")
async def on_startup():
    """Create database tables on startup."""
    print("Creating database tables...")
    await create_db_and_tables()
    print("Database tables created (if they didn't exist).")
