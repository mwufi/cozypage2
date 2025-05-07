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

# OAuth2 configuration
CLIENT_SECRETS_FILE = "client_secret.json"
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email', # Request email to identify user
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/calendar.readonly'
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

app = FastAPI(title="Mail API with Google OAuth and JWT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# In-memory store for Google tokens (replace with DB in production)
# Key: user_email, Value: dict of google tokens
google_user_tokens_db: Dict[str, dict] = {}

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub") # Assuming "sub" (subject) is the user_email
        if user_email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials - user_email missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(user_email=user_email)
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
    return User(email=token_data.user_email)

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
async def auth_google_callback(request: Request, code: str, state: str):
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
    
    # Get user info from Google to use as an identifier (email)
    userinfo_service = googleapiclient.discovery.build("oauth2", "v2", credentials=credentials)
    user_info = userinfo_service.userinfo().get().execute()
    user_email = user_info.get("email")

    if not user_email:
        return JSONResponse({"error": "Could not retrieve user email from Google"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Store Google tokens (access, refresh, etc.) associated with the user_email
    google_user_tokens_db[user_email] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

    # Create JWT for our frontend
    jwt_payload = {"sub": user_email} # "sub" is standard for subject (user identifier)
    app_jwt = create_access_token(data=jwt_payload)

    # Redirect to frontend callback with JWT
    frontend_callback_url = f"{FRONTEND_APP_URL}/auth/callback?jwt={app_jwt}"
    return RedirectResponse(frontend_callback_url)

@app.get("/drive")
async def drive_api_request(current_user: User = Depends(get_current_user)):
    user_email = current_user.email
    user_google_tokens = google_user_tokens_db.get(user_email)

    if not user_google_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User Google tokens not found. Please re-authenticate.")

    credentials = google.oauth2.credentials.Credentials(**user_google_tokens)
    
    # Check if token needs refresh (simplified check, Google library often handles this)
    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(google.auth.transport.requests.Request())
            # Update stored tokens after refresh
            google_user_tokens_db[user_email] = credentials_to_dict(credentials)
        except Exception as e:
            print(f"Error refreshing Google token for {user_email}: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to refresh Google token. Please re-authenticate.")

    drive = googleapiclient.discovery.build(
        DRIVE_API_SERVICE_NAME, DRIVE_API_VERSION, credentials=credentials
    )
    try:
        files = drive.files().list().execute()
        return files
    except Exception as e:
        print(f"Google Drive API error for {user_email}: {e}")
        # Check for specific auth errors from Google API call
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Google Drive: {str(e)}")

@app.get("/calendar")
async def calendar_api_request(current_user: User = Depends(get_current_user)):
    user_email = current_user.email
    user_google_tokens = google_user_tokens_db.get(user_email)

    if not user_google_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User Google tokens not found. Please re-authenticate.")

    credentials = google.oauth2.credentials.Credentials(**user_google_tokens)
    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(google.auth.transport.requests.Request())
            google_user_tokens_db[user_email] = credentials_to_dict(credentials)
        except Exception as e:
            print(f"Error refreshing Google token for {user_email}: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to refresh Google token. Please re-authenticate.")

    calendar = googleapiclient.discovery.build(
        CALENDAR_API_SERVICE_NAME, CALENDAR_API_VERSION, credentials=credentials
    )
    try:
        calendar_list = calendar.calendarList().list().execute()
        return calendar_list
    except Exception as e:
        print(f"Google Calendar API error for {user_email}: {e}")
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
async def root_redirect_to_login():
    # Simple page, or redirect to frontend, or provide API docs link
    return HTMLResponse(
        """<html><body><h1>FastAPI Google Auth Backend</h1>
        <p><a href=\"/auth/google/login\">Login with Google (Test Backend Flow)</a></p>
        <p>This backend issues JWTs to a configured frontend. Access protected APIs like /drive or /calendar with a Bearer JWT.</p>
        </body></html>"""
    )

if __name__ == "__main__":
    print(f"JWT_SECRET_KEY: {JWT_SECRET_KEY[:10]}... (ensure this is set securely in prod)")
    print(f"FRONTEND_APP_URL: {FRONTEND_APP_URL}")
    print(f"BACKEND_BASE_URL: {BACKEND_BASE_URL}")
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1" # For local dev over HTTP
    os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
