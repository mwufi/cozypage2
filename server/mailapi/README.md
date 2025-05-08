# FastAPI Google OAuth Server

This is a FastAPI server that demonstrates OAuth integration with Google APIs, specifically Drive and Calendar.

## Setup Requirements

### 1. Python Environment

Make sure you have Python 3.8+ installed. This project uses [uv](https://github.com/astral-sh/uv) for dependency management.

```sh
# Install dependencies using uv
uv pip install -r requirements.txt
```

### 2. Google Cloud Project Setup

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API and Google Calendar API for your project
3. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Set a name for your OAuth client
   - Add an authorized redirect URI: `http://localhost:8000/oauth2callback`
   - Click "Create"
4. Download the OAuth client credentials as JSON
5. Save the downloaded file as `client_secret.json` in the root directory of this project

### 3. Environment Variables

Create a `.env` file in the project root with the following variables:

```
SECRET_KEY=your_secure_random_secret_key
```

The `SECRET_KEY` is used for session encryption. Generate a secure random string for this value.

## Running the Server

Navigate to your workspace root directory (the parent directory of `server`) in your terminal.

Run the server using Uvicorn, pointing it to the application instance within the module:

```sh
# From workspace root (/Users/zenzen/ara-bunny)
uvicorn server.mailapi.main:app --reload --port 8000
```

*   `server.mailapi.main`: The Python module path to your main file.
*   `app`: The FastAPI application instance created in `main.py`.
*   `--reload`: Enables auto-reloading for development.
*   `--port 8000`: Specifies the port (optional, defaults to 8000).

The server will run at `http://localhost:8000`.

## Available Endpoints

- `/`: Home page with links to all features
- `/drive`: Access Google Drive files (requires authentication)
- `/calendar`: Access Google Calendar data (requires authentication)
- `/authorize`: Start the OAuth authorization flow
- `/oauth2callback`: OAuth callback endpoint (handled automatically)
- `/revoke`: Revoke the current access token
- `/clear`: Clear stored credentials from the session

## Notes

- When running locally, the app sets `OAUTHLIB_INSECURE_TRANSPORT=1` to allow OAuth to work over HTTP. In production, you should use HTTPS.
- If deploying to production:
  1. Update the `redirect_uri` in the code to use your production domain
  2. Add your production redirect URIs to the OAuth client in Google Cloud Console
  3. Use a real secret key and store it securely
  4. Remove the `OAUTHLIB_INSECURE_TRANSPORT` environment variable setting

## Extending the Application

To add more Google API services:
1. Add the required scopes to the `SCOPES` list in `main.py`
2. Create new endpoint functions following the pattern of the existing ones
3. Update the feature detection in `check_granted_scopes()`
