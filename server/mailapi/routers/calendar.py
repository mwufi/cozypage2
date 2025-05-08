from fastapi import APIRouter, Depends, HTTPException, status
import google.oauth2.credentials
import googleapiclient.discovery
# google.auth.transport.requests is handled by dependency
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, field_validator, ValidationInfo
from typing import Optional, List as PyList

# Adjust import path
from ..main import get_refreshed_google_credentials # Added dependency

router = APIRouter(
    prefix="/calendar",
    tags=["calendar"],
)

CALENDAR_API_SERVICE_NAME = 'calendar'
CALENDAR_API_VERSION = 'v3'

@router.get("/") # Corresponds to old /calendar GET (lists calendar list)
async def list_calendars(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    calendar_service = googleapiclient.discovery.build(
        CALENDAR_API_SERVICE_NAME, CALENDAR_API_VERSION, credentials=credentials
    )
    try:
        calendar_list = calendar_service.calendarList().list().execute()
        return calendar_list
    except Exception as e:
        print(f"Google Calendar API error (list_calendars): {e}")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Google Calendar List: {str(e)}")

# We will add endpoint for week's events and creating events later
@router.get("/events_week")
async def list_week_events(credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)):
    calendar_service = googleapiclient.discovery.build(CALENDAR_API_SERVICE_NAME, CALENDAR_API_VERSION, credentials=credentials)
    
    try:
        # Get current time and time for one week from now
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'  # 'Z' indicates UTC time
        time_max = (now + timedelta(days=7)).isoformat() + 'Z'

        events_result = calendar_service.events().list(
            calendarId='primary', 
            timeMin=time_min,
            timeMax=time_max,
            maxResults=25, # Max 25 events for the week view, adjust as needed
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date')) # Handles all-day events
            end = event['end'].get('dateTime', event['end'].get('date'))
            formatted_events.append({
                'id': event['id'],
                'summary': event.get('summary', 'No Title'),
                'start': start,
                'end': end,
                'location': event.get('location'),
                'description': event.get('description'),
                'htmlLink': event.get('htmlLink')
            })
        return {"events": formatted_events}
    except Exception as e:
        print(f"Google Calendar API error (events_week): {e}")
        if "insufficient permissions" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for Calendar.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked. Please re-authenticate.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error accessing Calendar events: {str(e)}")

# Endpoint for creating events will be added later
class EventDateTime(BaseModel):
    dateTime: Optional[str] = None
    date: Optional[str] = None
    timeZone: Optional[str] = None

    @field_validator('date', 'dateTime', mode='before')
    @classmethod
    def check_date_or_datetime(cls, v: Optional[str], info: ValidationInfo):
        values = info.data
        
        field_name = info.field_name
        has_date = values.get('date') is not None
        has_datetime = values.get('dateTime') is not None

        if field_name == 'date' and v is not None and values.get('dateTime') is not None:
            raise ValueError("Provide either 'date' for all-day or 'dateTime', not both.")
        if field_name == 'dateTime' and v is not None and values.get('date') is not None:
             raise ValueError("Provide either 'date' for all-day or 'dateTime', not both.")

        return v

class Attendee(BaseModel):
    email: EmailStr
    # responseStatus: Optional[str] = 'needsAction' # Omitted for simplicity, API defaults

class CreateEventSchema(BaseModel):
    summary: str
    start: EventDateTime
    end: EventDateTime
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[PyList[Attendee]] = None
    # recurrence: Optional[PyList[str]] = None # e.g., ["RRULE:FREQ=WEEKLY;COUNT=5"]
    # reminders: Optional[dict] = None # e.g., {'useDefault': False, 'overrides': [...]} 

@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event_data: CreateEventSchema,
    credentials: google.oauth2.credentials.Credentials = Depends(get_refreshed_google_credentials)
):
    calendar_service = googleapiclient.discovery.build(CALENDAR_API_SERVICE_NAME, CALENDAR_API_VERSION, credentials=credentials)
    
    # Ensure start and end times are valid together
    if (event_data.start.dateTime and not event_data.end.dateTime) or (event_data.start.date and not event_data.end.date):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Both start and end must use either dateTime or date.")

    event_body = event_data.dict(exclude_none=True)

    try:
        created_event = calendar_service.events().insert(calendarId='primary', body=event_body).execute()
        return {
            "message": "Event created successfully!",
            "id": created_event.get('id'),
            "summary": created_event.get('summary'),
            "htmlLink": created_event.get('htmlLink')
        }
    except Exception as e:
        print(f"Google Calendar API error (create event): {e}")
        if "insufficient permissions" in str(e).lower() or "forbidden" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create calendar event.")
        if "invalid_grant" in str(e).lower() or "token has been expired or revoked" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token invalid or revoked.")
        # Add check for invalid attendee or other specific errors if needed
        # e.g., if 'Invalid attendee' in str(e): raise HTTPException(status_code=400, detail=...) 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not create calendar event: {str(e)}") 