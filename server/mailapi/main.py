import os
from typing import Dict, Optional, List
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.security import OAuth2AuthorizationCodeBearer
from pydantic import BaseModel
import requests
import uvicorn
from starlette.middleware.sessions import SessionMiddleware

import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery

# OAuth2 configuration
CLIENT_SECRETS_FILE = "client_secret.json"
SCOPES = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/calendar.readonly'
]
DRIVE_API_SERVICE_NAME = 'drive'
DRIVE_API_VERSION = 'v2'
CALENDAR_API_SERVICE_NAME = 'calendar'
CALENDAR_API_VERSION = 'v3'

app = FastAPI(title="Mail API with Google OAuth")
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "REPLACE_THIS_WITH_A_REAL_SECRET_KEY")
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

@app.get("/", response_class=HTMLResponse)
async def index():
    return get_index_html()

@app.get("/drive")
async def drive_api_request(request: Request):
    if "credentials" not in request.session:
        return RedirectResponse(url="/authorize")

    features = request.session["features"]

    if features["drive"]:
        # Load credentials from the session
        credentials = google.oauth2.credentials.Credentials(
            **request.session["credentials"]
        )

        drive = googleapiclient.discovery.build(
            DRIVE_API_SERVICE_NAME, DRIVE_API_VERSION, credentials=credentials
        )

        files = drive.files().list().execute()

        # Save credentials back to session in case access token was refreshed
        request.session["credentials"] = credentials_to_dict(credentials)

        return files
    else:
        return {"error": "Drive feature is not enabled."}

@app.get("/calendar")
async def calendar_api_request(request: Request):
    if "credentials" not in request.session:
        return RedirectResponse(url="/authorize")

    features = request.session["features"]

    if features["calendar"]:
        # Load credentials from the session
        credentials = google.oauth2.credentials.Credentials(
            **request.session["credentials"]
        )

        calendar = googleapiclient.discovery.build(
            CALENDAR_API_SERVICE_NAME, CALENDAR_API_VERSION, credentials=credentials
        )

        # Get list of calendars
        calendar_list = calendar.calendarList().list().execute()

        # Save credentials back to session in case access token was refreshed
        request.session["credentials"] = credentials_to_dict(credentials)

        return calendar_list
    else:
        return {"error": "Calendar feature is not enabled."}

@app.get("/authorize")
async def authorize(request: Request):
    # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES
    )

    # The URI must exactly match one of the authorized redirect URIs for the OAuth 2.0 client
    flow.redirect_uri = f"{request.base_url.scheme}://{request.base_url.netloc}/oauth2callback"

    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission
        access_type="offline",
        # Enable incremental authorization
        include_granted_scopes="true",
    )

    # Store the state so the callback can verify the auth server response
    request.session["state"] = state

    return RedirectResponse(url=authorization_url)

@app.get("/oauth2callback")
async def oauth2callback(request: Request):
    # Verify state parameter
    if "state" not in request.session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State parameter missing"
        )
    
    state = request.session["state"]

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state
    )
    flow.redirect_uri = f"{request.base_url.scheme}://{request.base_url.netloc}/oauth2callback"

    # Use the authorization server's response to fetch the OAuth 2.0 tokens
    authorization_response = str(request.url)
    flow.fetch_token(authorization_response=authorization_response)

    # Store credentials in the session
    credentials = flow.credentials
    credentials_dict = credentials_to_dict(credentials)
    request.session["credentials"] = credentials_dict

    # Check which scopes user granted
    features = check_granted_scopes(credentials_dict)
    request.session["features"] = features
    
    return RedirectResponse(url="/")

@app.get("/revoke")
async def revoke(request: Request):
    if "credentials" not in request.session:
        return HTMLResponse(
            'You need to <a href="/authorize">authorize</a> before testing the code to revoke credentials.'
        )

    credentials = google.oauth2.credentials.Credentials(
        **request.session["credentials"]
    )

    revoke_response = requests.post(
        "https://oauth2.googleapis.com/revoke",
        params={"token": credentials.token},
        headers={"content-type": "application/x-www-form-urlencoded"},
    )

    status_code = revoke_response.status_code
    if status_code == 200:
        return HTMLResponse(f'Credentials successfully revoked.<br><br>{get_index_html()}')
    else:
        return HTMLResponse(f'An error occurred.<br><br>{get_index_html()}')

@app.get("/clear")
async def clear_credentials(request: Request):
    if "credentials" in request.session:
        del request.session["credentials"]
    return HTMLResponse(f'Credentials have been cleared.<br><br>{get_index_html()}')

def credentials_to_dict(credentials):
    return {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "granted_scopes": credentials.scopes if hasattr(credentials, 'scopes') else [],
    }

def check_granted_scopes(credentials):
    features = {}
    granted_scopes = credentials.get("granted_scopes", [])
    
    if isinstance(granted_scopes, str):
        granted_scopes = granted_scopes.split()
    
    features["drive"] = 'https://www.googleapis.com/auth/drive.metadata.readonly' in granted_scopes
    features["calendar"] = 'https://www.googleapis.com/auth/calendar.readonly' in granted_scopes
    
    return features

def get_index_html():
    return """
    <html>
    <head>
        <title>Google API FastAPI Demo</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            td { padding: 10px; border: 1px solid #ddd; }
            a { color: #4285f4; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <h1>Google API Integration Demo</h1>
        <table>
            <tr>
                <td><a href="/drive">Test Drive API</a></td>
                <td>Access your Google Drive files metadata</td>
            </tr>
            <tr>
                <td><a href="/calendar">Test Calendar API</a></td>
                <td>Access your Google Calendar data</td>
            </tr>
            <tr>
                <td><a href="/authorize">Authorize</a></td>
                <td>Start the authorization flow to grant access to your Google account</td>
            </tr>
            <tr>
                <td><a href="/revoke">Revoke Credentials</a></td>
                <td>Revoke the current access token</td>
            </tr>
            <tr>
                <td><a href="/clear">Clear Session</a></td>
                <td>Clear the credentials stored in the current session</td>
            </tr>
        </table>
    </body>
    </html>
    """

if __name__ == "__main__":
    # When running locally, disable OAuthlib's HTTPs verification
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    
    # This disables the requested scopes and granted scopes check
    os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
    
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
