/**
 * GoogleCalendarIntegration Component - Connect with Google Calendar
 * 
 * Features:
 * - Google OAuth2 authentication
 * - View Google Calendar events
 * - Sync tasks and habits to Google Calendar
 * - Bidirectional synchronization
 * - Multiple calendar support
 */
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  Sync, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Plus,
  RefreshCw,
  Link,
  Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface GoogleCalendarIntegrationProps {
  className?: string;
}

interface GoogleCalendar {
  id: string;
  name: string;
  description: string;
  primary: boolean;
  access_role: string;
  color: string;
}

interface GoogleEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  status: string;
  html_link: string;
  calendar_id: string;
}

export function GoogleCalendarIntegration({ className }: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary');
  const [showSettings, setShowSettings] = useState(false);
  const [autoSyncTasks, setAutoSyncTasks] = useState(false);
  const [autoSyncHabits, setAutoSyncHabits] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Check if user is already connected (from localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem('google_calendar_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsConnected(true);
    }
  }, []);
  
  // Fetch Google Calendars
  const { data: calendars = [], isLoading: calendarsLoading } = useQuery({
    queryKey: ['google-calendars', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      
      const response = await fetch(
        `/api/v1/google-calendar/calendars?access_token=${accessToken}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendars');
      }
      
      const data = await response.json();
      return data.calendars as GoogleCalendar[];
    },
    enabled: !!accessToken,
  });
  
  // Fetch Google Calendar Events
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['google-calendar-events', accessToken, selectedCalendar],
    queryFn: async () => {
      if (!accessToken) return [];
      
      const response = await fetch(
        `/api/v1/google-calendar/events?calendar_id=${selectedCalendar}&access_token=${accessToken}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      return data.events as GoogleEvent[];
    },
    enabled: !!accessToken,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
  
  // Connect to Google Calendar
  const handleConnect = useCallback(async () => {
    try {
      // Get authorization URL
      const response = await fetch(
        `/api/v1/google-calendar/auth-url?redirect_uri=${encodeURIComponent(window.location.origin + '/calendar/google-callback')}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.auth_url;
      
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
    }
  }, []);
  
  // Disconnect from Google Calendar
  const handleDisconnect = useCallback(() => {
    localStorage.removeItem('google_calendar_token');
    setAccessToken(null);
    setIsConnected(false);
    queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
    queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
  }, [queryClient]);
  
  // Sync Task to Google Calendar
  const syncTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(
        `/api/v1/google-calendar/sync-task/${taskId}?calendar_id=${selectedCalendar}&access_token=${accessToken}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to sync task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchEvents();
    },
  });
  
  // Sync Habit to Google Calendar
  const syncHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const response = await fetch(
        `/api/v1/google-calendar/sync-habit/${habitId}?calendar_id=${selectedCalendar}&access_token=${accessToken}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to sync habit');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchEvents();
    },
  });
  
  // Get primary calendar
  const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
  
  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Google Calendar</h3>
            <p className="text-muted-foreground mb-6">
              Sync your ECHO tasks and habits with Google Calendar for seamless productivity management.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>View your existing events</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sync tasks as calendar events</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Schedule habit reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Bidirectional synchronization</span>
              </div>
            </div>
            
            <Button onClick={handleConnect} className="bg-gradient-primary">
              <Link className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchEvents()}
                disabled={eventsLoading}
              >
                <RefreshCw className={cn('h-4 w-4', eventsLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Calendar Selection */}
          {calendars.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Active Calendar</label>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map(calendar => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: calendar.color }}
                        />
                        {calendar.name}
                        {calendar.primary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Events Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {calendarsLoading ? '...' : calendars.length}
              </div>
              <div className="text-sm text-muted-foreground">Calendars</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {eventsLoading ? '...' : events.length}
              </div>
              <div className="text-sm text-muted-foreground">Events This Month</div>
            </div>
          </div>
          
          {/* Recent Events */}
          {events.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Events</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.start_time).toLocaleDateString()} 
                        {!event.all_day && ` at ${new Date(event.start_time).toLocaleTimeString()}`}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(event.html_link, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span>Auto-sync enabled</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs">Tasks</span>
                  <Switch
                    checked={autoSyncTasks}
                    onCheckedChange={setAutoSyncTasks}
                    size="sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Habits</span>
                  <Switch
                    checked={autoSyncHabits}
                    onCheckedChange={setAutoSyncHabits}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Calendar Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Connected Account</h4>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{primaryCalendar?.name || 'Google Calendar'}</div>
                    <div className="text-sm text-muted-foreground">
                      {calendars.length} calendar{calendars.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Synchronization</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Auto-sync Tasks</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically create calendar events for tasks with due dates
                    </div>
                  </div>
                  <Switch
                    checked={autoSyncTasks}
                    onCheckedChange={setAutoSyncTasks}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Auto-sync Habits</div>
                    <div className="text-xs text-muted-foreground">
                      Create recurring reminders for daily habits
                    </div>
                  </div>
                  <Switch
                    checked={autoSyncHabits}
                    onCheckedChange={setAutoSyncHabits}
                  />
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Changes to sync settings will apply to new tasks and habits. 
                Existing items can be synced manually.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="mr-auto"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
            
            <Button onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GoogleCalendarIntegration;