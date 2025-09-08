"""
Google Calendar Integration Service

This service handles all Google Calendar API interactions:
- Authentication with Google OAuth2
- Fetching calendar events
- Creating events from tasks/habits
- Syncing bidirectionally
- Managing multiple calendars
"""
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings
from app.schemas.event import EventCreate, EventUpdate
from app.models.event import Event

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    """Google Calendar API integration service"""
    
    # OAuth 2.0 scopes for Google Calendar
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    def __init__(self):
        self.credentials = None
        self.service = None
        
    def get_auth_url(self, redirect_uri: str) -> str:
        """
        Generate Google OAuth2 authorization URL
        
        Args:
            redirect_uri: Where Google should redirect after auth
            
        Returns:
            Authorization URL for user to visit
        """
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=self.SCOPES
        )
        flow.redirect_uri = redirect_uri
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force consent to get refresh token
        )
        
        return auth_url
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access tokens
        
        Args:
            code: Authorization code from Google
            redirect_uri: Same redirect URI used in auth URL
            
        Returns:
            Token information including access_token and refresh_token
        """
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=self.SCOPES
        )
        flow.redirect_uri = redirect_uri
        
        # Exchange code for tokens
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes,
            'expiry': credentials.expiry.isoformat() if credentials.expiry else None
        }
    
    def set_credentials(self, token_data: Dict[str, Any]):
        """
        Set credentials from stored token data
        
        Args:
            token_data: Token information from database
        """
        self.credentials = Credentials(
            token=token_data['access_token'],
            refresh_token=token_data.get('refresh_token'),
            token_uri=token_data.get('token_uri'),
            client_id=token_data.get('client_id'),
            client_secret=token_data.get('client_secret'),
            scopes=token_data.get('scopes')
        )
        
        # Refresh token if expired
        if self.credentials.expired and self.credentials.refresh_token:
            self.credentials.refresh(Request())
        
        # Build the service
        self.service = build('calendar', 'v3', credentials=self.credentials)
    
    def get_calendars(self) -> List[Dict[str, Any]]:
        """
        Get list of user's calendars
        
        Returns:
            List of calendar information
        """
        if not self.service:
            raise ValueError("Not authenticated with Google Calendar")
        
        try:
            calendar_list = self.service.calendarList().list().execute()
            calendars = []
            
            for calendar in calendar_list.get('items', []):
                calendars.append({
                    'id': calendar['id'],
                    'name': calendar['summary'],
                    'description': calendar.get('description', ''),
                    'primary': calendar.get('primary', False),
                    'access_role': calendar.get('accessRole', 'reader'),
                    'color': calendar.get('backgroundColor', '#1976D2')
                })
            
            return calendars
            
        except HttpError as error:
            logger.error(f"Error fetching calendars: {error}")
            raise
    
    def get_events(self, 
                   calendar_id: str = 'primary',
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None,
                   max_results: int = 250) -> List[Dict[str, Any]]:
        """
        Get events from Google Calendar
        
        Args:
            calendar_id: Calendar ID (default: 'primary')
            start_date: Start date for events
            end_date: End date for events
            max_results: Maximum number of events to return
            
        Returns:
            List of calendar events
        """
        if not self.service:
            raise ValueError("Not authenticated with Google Calendar")
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if not end_date:
            # Last day of current month
            next_month = start_date.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
            end_date = end_date.replace(hour=23, minute=59, second=59)
        
        try:
            events_result = self.service.events().list(
                calendarId=calendar_id,
                timeMin=start_date.isoformat() + 'Z',
                timeMax=end_date.isoformat() + 'Z',
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = []
            for event in events_result.get('items', []):
                # Parse event data
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                events.append({
                    'id': event['id'],
                    'title': event.get('summary', 'No Title'),
                    'description': event.get('description', ''),
                    'location': event.get('location', ''),
                    'start_time': start,
                    'end_time': end,
                    'all_day': 'date' in event['start'],  # All-day if no time specified
                    'status': event.get('status', 'confirmed'),
                    'html_link': event.get('htmlLink', ''),
                    'creator': event.get('creator', {}),
                    'attendees': event.get('attendees', []),
                    'recurrence': event.get('recurrence', []),
                    'calendar_id': calendar_id
                })
            
            return events
            
        except HttpError as error:
            logger.error(f"Error fetching events: {error}")
            raise
    
    def create_event(self, 
                     event_data: Dict[str, Any],
                     calendar_id: str = 'primary') -> Dict[str, Any]:
        """
        Create event in Google Calendar
        
        Args:
            event_data: Event information
            calendar_id: Target calendar ID
            
        Returns:
            Created event information
        """
        if not self.service:
            raise ValueError("Not authenticated with Google Calendar")
        
        try:
            # Format event for Google Calendar API
            google_event = {
                'summary': event_data['title'],
                'description': event_data.get('description', ''),
                'location': event_data.get('location', ''),
                'start': {
                    'dateTime': event_data['start_time'],
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': event_data['end_time'],
                    'timeZone': 'UTC',
                },
            }
            
            # Handle all-day events
            if event_data.get('all_day', False):
                # Convert to date format for all-day events
                start_date = datetime.fromisoformat(event_data['start_time'].replace('Z', '')).date()
                end_date = datetime.fromisoformat(event_data['end_time'].replace('Z', '')).date()
                
                google_event['start'] = {'date': start_date.isoformat()}
                google_event['end'] = {'date': end_date.isoformat()}
            
            # Add reminders if specified
            if event_data.get('reminders'):
                google_event['reminders'] = {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': minutes}
                        for minutes in event_data['reminders']
                    ]
                }
            
            # Create the event
            created_event = self.service.events().insert(
                calendarId=calendar_id,
                body=google_event
            ).execute()
            
            logger.info(f"Created Google Calendar event: {created_event['id']}")
            return created_event
            
        except HttpError as error:
            logger.error(f"Error creating event: {error}")
            raise
    
    def update_event(self,
                     event_id: str,
                     event_data: Dict[str, Any],
                     calendar_id: str = 'primary') -> Dict[str, Any]:
        """
        Update event in Google Calendar
        
        Args:
            event_id: Google Calendar event ID
            event_data: Updated event information
            calendar_id: Calendar ID
            
        Returns:
            Updated event information
        """
        if not self.service:
            raise ValueError("Not authenticated with Google Calendar")
        
        try:
            # Get existing event
            existing_event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            # Update fields
            existing_event['summary'] = event_data.get('title', existing_event.get('summary'))
            existing_event['description'] = event_data.get('description', existing_event.get('description', ''))
            existing_event['location'] = event_data.get('location', existing_event.get('location', ''))
            
            if 'start_time' in event_data:
                existing_event['start'] = {
                    'dateTime': event_data['start_time'],
                    'timeZone': 'UTC',
                }
            
            if 'end_time' in event_data:
                existing_event['end'] = {
                    'dateTime': event_data['end_time'],
                    'timeZone': 'UTC',
                }
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=existing_event
            ).execute()
            
            logger.info(f"Updated Google Calendar event: {event_id}")
            return updated_event
            
        except HttpError as error:
            logger.error(f"Error updating event: {error}")
            raise
    
    def delete_event(self, event_id: str, calendar_id: str = 'primary'):
        """
        Delete event from Google Calendar
        
        Args:
            event_id: Google Calendar event ID
            calendar_id: Calendar ID
        """
        if not self.service:
            raise ValueError("Not authenticated with Google Calendar")
        
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            logger.info(f"Deleted Google Calendar event: {event_id}")
            
        except HttpError as error:
            logger.error(f"Error deleting event: {error}")
            raise
    
    def create_event_from_task(self, task_data: Dict[str, Any], calendar_id: str = 'primary') -> Dict[str, Any]:
        """
        Create Google Calendar event from ECHO task
        
        Args:
            task_data: Task information
            calendar_id: Target calendar ID
            
        Returns:
            Created event information
        """
        # Convert task to event format
        event_data = {
            'title': f"📋 Task: {task_data['title']}",
            'description': f"ECHO Task\n\n{task_data.get('description', '')}\n\nPriority: {task_data.get('priority', 'medium').title()}",
            'start_time': task_data['due_date'] if task_data.get('due_date') else (datetime.now() + timedelta(hours=1)).isoformat(),
            'end_time': (datetime.fromisoformat(task_data['due_date']) + timedelta(hours=1)).isoformat() if task_data.get('due_date') else (datetime.now() + timedelta(hours=2)).isoformat(),
            'reminders': [15, 60] if task_data.get('priority') == 'high' else [15]  # More reminders for high priority
        }
        
        return self.create_event(event_data, calendar_id)
    
    def create_event_from_habit(self, habit_data: Dict[str, Any], calendar_id: str = 'primary') -> Dict[str, Any]:
        """
        Create Google Calendar event from ECHO habit
        
        Args:
            habit_data: Habit information
            calendar_id: Target calendar ID
            
        Returns:
            Created event information
        """
        # Convert habit to event format
        event_data = {
            'title': f"🎯 Habit: {habit_data['name']}",
            'description': f"ECHO Habit Reminder\n\n{habit_data.get('description', '')}\n\nFrequency: {habit_data.get('frequency', 'daily').title()}\nCurrent Streak: {habit_data.get('current_streak', 0)} days",
            'start_time': (datetime.now() + timedelta(hours=1)).isoformat(),
            'end_time': (datetime.now() + timedelta(hours=1, minutes=30)).isoformat(),
            'reminders': [10]  # 10 minute reminder for habits
        }
        
        return self.create_event(event_data, calendar_id)