import os
from dotenv import load_dotenv # Add this import
load_dotenv() # Add this line to load environment variables

import jwt # For JWT
from datetime import datetime, timedelta # For JWT expiry
from typing import Dict, Optional, List

from fastapi import FastAPI, Request, Depends, HTTPException, status, Response as FastAPIResponse, Query
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
from sqlalchemy.future import select # For SQLAlchemy 2.0 style queries
from shared.database_config.database import engine, Base, get_db, create_db_and_tables
from shared.database_models.models import UserGoogleToken, Profile, Todo # Added Todo
# --- End Database Imports ---

# OAuth2 configuration
# CLIENT_SECRETS_FILE = "server/mailapi/client_secret.json" # Removed: Will load from env vars
# Instead of CLIENT_SECRETS_FILE, ensure these environment variables are set in production:
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
# GOOGLE_PROJECT_ID (optional, but good practice)
# GOOGLE_AUTH_URI (defaults to "https://accounts.google.com/o/oauth2/auth")
# GOOGLE_TOKEN_URI (defaults to "https://oauth2.googleapis.com/token")

SCOPES = [
    'openid', # Add openid scope
    'https://www.googleapis.com/auth/userinfo.email', # Request email to identify user
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.freebusy',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
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

# Pydantic models for Todo
class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None

class TodoCreate(TodoBase):
    pass

class TodoResponse(TodoBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True # Changed from `from_attributes = True` for older Pydantic

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
    db_token_entry = await db.get(UserGoogleToken, user_email)

    if not db_token_entry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User Google tokens not found in DB. Please re-authenticate."
        )
    
    print(f"DB token entry: {db_token_entry}")

    # Construct dict specifically for Google Credentials, excluding user_email
    token_data_for_google_creds = {
        'token': db_token_entry.token,
        'refresh_token': db_token_entry.refresh_token,
        'token_uri': db_token_entry.token_uri,
        'client_id': db_token_entry.client_id,
        'client_secret': db_token_entry.client_secret,
        'scopes': db_token_entry.scopes
    }
    credentials = google.oauth2.credentials.Credentials(**token_data_for_google_creds)
    
    if credentials.expired and credentials.refresh_token:
        print(f"Google token expired for {user_email}, attempting refresh...")
        try:
            request_object = google.auth.transport.requests.Request()
            credentials.refresh(request_object)
            # Update the stored tokens in DB with the refreshed ones
            refreshed_token_data = credentials_to_dict(credentials) # This helper is fine
            for key, value in refreshed_token_data.items():
                setattr(db_token_entry, key, value)
            await db.commit()
            await db.refresh(db_token_entry)
            print(f"Successfully refreshed Google token for {user_email} in DB")
        except google.auth.exceptions.RefreshError as e:
            print(f"Failed to refresh Google token for {user_email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail=f"Failed to refresh Google token ({e}). Please re-authenticate."
            )
        except Exception as e:
            print(f"Unexpected error refreshing Google token for {user_email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred during token refresh: {e}"
            )
    elif credentials.expired and not credentials.refresh_token:
        print(f"Google token expired for {user_email}, but no refresh token found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session expired, and no refresh token available. Please re-authenticate."
        )
        
    if not credentials.valid:
         print(f"Google token is invalid for {user_email} even after refresh check.")
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials. Please re-authenticate."
         )
    return credentials

def get_google_flow(state: Optional[str] = None) -> google_auth_oauthlib.flow.Flow:
    # Load client secrets from environment variables
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    project_id = os.getenv("GOOGLE_PROJECT_ID") # Optional
    auth_uri = os.getenv("GOOGLE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth")
    token_uri = os.getenv("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token")

    if not client_id or not client_secret:
        # In a real application, you might want to log this error more formally
        # or raise a more specific configuration error.
        print("FATAL ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not set.")
        raise ValueError("Google OAuth client ID and secret must be set in environment variables for the application to function.")

    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "project_id": project_id, # Will be None if not set, which is fine
            "auth_uri": auth_uri,
            "token_uri": token_uri,
            # redirect_uris is typically part of client_secret.json, but
            # flow.redirect_uri is set explicitly below, which is preferred for clarity.
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", # Standard value
        }
    }

    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config,
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
    print(f"Stored state: {stored_state}, received state: {state}")
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
    user_name = user_info.get("name") # Get user's name from Google profile
    # user_picture = user_info.get("picture") # Optional: get user's picture

    if not user_email:
        return JSONResponse({"error": "Could not retrieve user email from Google"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- Profile Handling --- 
    # Check if a profile exists for this user_email, or create one.
    profile_query = await db.execute(select(Profile).where(Profile.user_email == user_email))
    db_profile = profile_query.scalar_one_or_none()

    if not db_profile:
        print(f"No profile found for {user_email}, creating one.")
        db_profile = Profile(
            user_email=user_email,
            username=user_name # Set username from Google profile if available
            # color_theme could be set to a default or left null
        )
        db.add(db_profile)
        # We need to flush to get the db_profile.id if it's new
        # Or commit and then refresh. Let's commit profile separately first or handle via token update.
        # For simplicity, let's commit here. If token saving fails, this profile might be orphaned.
        # A better approach might be to add both and commit once, but requires careful error handling.
        await db.flush() # Flush to get the ID of the new profile
        # await db.refresh(db_profile) # Refresh to get any DB-generated fields like ID, created_at
        print(f"Created new profile for {user_email} with ID {db_profile.id}")
    else:
        print(f"Found existing profile for {user_email} with ID {db_profile.id}")
        # Optionally update profile fields like username if they logged in with Google again
        if db_profile.username != user_name and user_name:
             db_profile.username = user_name
             print(f"Updating username for {user_email} to {user_name}")
    # --- End Profile Handling ---

    # Store/Update Google tokens in the database
    token_data_dict = credentials_to_dict(credentials)
    # We use UserGoogleToken.user_email as PK, which is the email from this specific Google account.
    db_token_entry_query = await db.execute(select(UserGoogleToken).where(UserGoogleToken.user_email == user_email))
    db_token_entry = db_token_entry_query.scalar_one_or_none()

    if db_token_entry:
        # Update existing entry
        for key, value in token_data_dict.items():
            setattr(db_token_entry, key, value)
        db_token_entry.profile_id = db_profile.id # Ensure profile_id is linked
        print(f"Updating Google tokens for {user_email} in DB, linked to profile ID {db_profile.id}.")
    else:
        # Create new entry, ensuring it's linked to the profile
        db_token_entry = UserGoogleToken(
            user_email=user_email, # This is the Google account's email
            profile_id=db_profile.id, # Link to the profile
            **token_data_dict
        )
        db.add(db_token_entry)
        print(f"Storing new Google tokens for {user_email} in DB, linked to profile ID {db_profile.id}.")
    
    await db.commit() # Commit changes for Profile (if new/updated) and UserGoogleToken
    await db.refresh(db_profile) # Refresh profile to get all fields like created_at, updated_at
    if db_token_entry: # Refresh token entry if it was created/updated
        await db.refresh(db_token_entry)

    # Create JWT for our frontend
    # The JWT subject ("sub") should ideally be the Profile's unique user_email or ID.
    # Sticking with user_email for now as that's what get_current_user expects.
    jwt_payload = {"sub": db_profile.user_email} 
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
    
    if not db_token_entry.refresh_token: # Check refresh_token directly from model
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No refresh token available for this user. Re-authentication required.")

    # Construct dict specifically for Google Credentials
    token_data_for_google_creds = {
        'token': db_token_entry.token,
        'refresh_token': db_token_entry.refresh_token,
        'token_uri': db_token_entry.token_uri,
        'client_id': db_token_entry.client_id,
        'client_secret': db_token_entry.client_secret,
        'scopes': db_token_entry.scopes
    }
    credentials = google.oauth2.credentials.Credentials(**token_data_for_google_creds)
    
    try:
        request_object = google.auth.transport.requests.Request()
        credentials.refresh(request_object)
        # Update the stored tokens in DB
        refreshed_token_data = credentials_to_dict(credentials) # This helper is fine
        for key, value in refreshed_token_data.items():
            setattr(db_token_entry, key, value)
        await db.commit()
        await db.refresh(db_token_entry)
        print(f"Successfully refreshed Google token for {user_email} in DB via manual refresh endpoint")
        return {"message": f"Google token refreshed successfully for {user_email}", "new_expiry": credentials.expiry.isoformat() }
    except Exception as e:
        print(f"Error explicitly refreshing Google token for {user_email}: {e}")
        if "invalid_grant" in str(e).lower():
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
    print("Skipping automatic table creation. Use Alembic for migrations.")
    # await create_db_and_tables() # Commented out: Alembic will handle this
    # print("Database tables created (if they didn't exist).")

# --- Todo Endpoints ---
@app.post("/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_create: TodoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Assuming todos are user-specific
):
    db_todo = Todo(**todo_create.dict())
    # If you want to associate the todo with the current user (profile):
    # profile_query = await db.execute(select(Profile).where(Profile.user_email == current_user.email))
    # db_profile = profile_query.scalar_one_or_none()
    # if not db_profile:
    #     raise HTTPException(status_code=404, detail="User profile not found")
    # db_todo.profile_id = db_profile.id # Assuming you added profile_id to Todo model

    db.add(db_todo)
    await db.commit()
    await db.refresh(db_todo)

    # Call Restate service to mark the todo as complete (as per user's plan)
    # Default to inter-container communication if RESTATE_URL is not set
    default_restate_service_hostname = "python-hello-world"
    restate_service_url_from_env = os.getenv("RESTATE_URL")
    
    if restate_service_url_from_env:
        actual_restate_url = f"{restate_service_url_from_env}/Greeter/completeTodo"
    else:
        # Fallback if RESTATE_URL is not defined (e.g., for other deployment scenarios)
        actual_restate_url = f"http://{default_restate_service_hostname}:9080/Greeter/completeTodo"

    try:
        print(f"Calling Restate service at {actual_restate_url} to complete todo ID: {db_todo.id}")
        # Get the Restate API key from environment variable
        restate_api_key = os.getenv("RESTATE_API_KEY")
        headers = {"Authorization": f"Bearer {restate_api_key}"} if restate_api_key else {}
        
        response = requests.post(actual_restate_url, json={"todoId": db_todo.id}, headers=headers)
        response.raise_for_status() # Raise an exception for HTTP errors
        print(f"Restate service responded for todo {db_todo.id}: {response.status_code}")
        # Note: The actual completion in the DB is handled by the Restate service itself.
        # Here, we are just notifying it.
    except requests.exceptions.RequestException as e:
        print(f"Error calling Restate service for todo {db_todo.id}: {e}")
        # Decide how to handle this: fail the request, log, or proceed without Restate call completion
        # For now, we log and proceed, the todo is created but not marked by Restate.
        # Consider raising an HTTPException or implementing a retry mechanism.
        pass # Or raise HTTPException(status_code=503, detail=f"Todo created, but failed to call completion service: {e}")

    return db_todo

@app.get("/todos", response_model=List[TodoResponse])
async def read_todos(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
    # current_user: User = Depends(get_current_user) # Uncomment if todos should be filtered by user
):
    query = select(Todo).offset(skip).limit(limit)
    # if current_user:
    #     # Assuming todos are linked to profiles and Profile has user_email
    #     profile_query = await db.execute(select(Profile.id).where(Profile.user_email == current_user.email))
    #     profile_id = profile_query.scalar_one_or_none()
    #     if profile_id:
    #         query = query.where(Todo.profile_id == profile_id)
    #     else: # No profile found for user, so no todos for them (if todos are strictly profile-linked)
    #         return []
            
    result = await db.execute(query)
    todos = result.scalars().all()
    return todos
