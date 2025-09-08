/**
 * CalendarView Component - Google Calendar Integration Only
 * 
 * This component provides a clean interface for users to connect their
 * Google Calendar to ECHO for seamless productivity management.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  RotateCcw, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Link,
  Unlink,
  ArrowRight
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

export function CalendarView() {
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
        `${import.meta.env.VITE_API_BASE_URL}/google-calendar/calendars?access_token=${accessToken}`
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
        `${import.meta.env.VITE_API_BASE_URL}/google-calendar/events?calendar_id=${selectedCalendar}&access_token=${accessToken}`
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
      const redirectUri = window.location.origin + '/calendar/google-callback';
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/google-calendar/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      // Get authorization URL
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get authorization URL: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
      } else {
        throw new Error('No authorization URL received from server');
      }
      
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      alert(`Error connecting to Google Calendar: ${error.message}`);
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
  
  // Get primary calendar
  const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
  
  // If not connected, show connection interface
  if (!isConnected) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Calendar className="h-8 w-8" />
                Google Calendar Integration
              </h1>
              <p className="text-muted-foreground">
                Connect your Google Calendar to sync tasks and habits seamlessly
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Connection Interface */}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-12">
              <div className="text-center space-y-8">
                {/* Large Calendar Icon */}
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Calendar className="h-12 w-12 text-white" />
                </div>
                
                {/* Main Heading */}
                <div>
                  <h2 className="text-2xl font-bold mb-3">Connect Your Google Calendar</h2>
                  <p className="text-muted-foreground text-lg">
                    Sync your ECHO tasks and habits with Google Calendar for seamless productivity management.
                  </p>
                </div>
                
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                  <div className="flex items-start gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">View your existing events</div>
                      <div className="text-sm text-muted-foreground">
                        See all your Google Calendar events directly in ECHO
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Sync tasks as calendar events</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically create calendar events for tasks with due dates
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Schedule habit reminders</div>
                      <div className="text-sm text-muted-foreground">
                        Create recurring reminders for your daily habits
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Bidirectional synchronization</div>
                      <div className="text-sm text-muted-foreground">
                        Changes sync both ways between ECHO and Google Calendar
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connect Button */}
                <Button 
                  onClick={handleConnect} 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link className="h-5 w-5 mr-3" />
                  Connect Google Calendar
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
                
                {/* Security Note */}
                <div className="text-xs text-muted-foreground max-w-md mx-auto">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Your calendar data is secure. ECHO only accesses what you explicitly authorize.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If connected, show calendar management interface
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              Google Calendar
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Your Google Calendar is connected and syncing with ECHO
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchEvents()}
              disabled={eventsLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', eventsLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Calendar Selection */}
        {calendars.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger className="w-full">
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
            </CardContent>
          </Card>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {calendarsLoading ? '...' : calendars.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Connected Calendars</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {eventsLoading ? '...' : events.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Events This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {autoSyncTasks || autoSyncHabits ? 'Active' : 'Manual'}
                  </div>
                  <div className="text-sm text-muted-foreground">Sync Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Events */}
        {events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 8).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.start_time).toLocaleDateString()} 
                        {!event.all_day && ` at ${new Date(event.start_time).toLocaleTimeString()}`}
                        {event.location && ` • ${event.location}`}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(event.html_link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Sync Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-sync Tasks</div>
                  <div className="text-sm text-muted-foreground">
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
                  <div className="font-medium">Auto-sync Habits</div>
                  <div className="text-sm text-muted-foreground">
                    Create recurring reminders for daily habits
                  </div>
                </div>
                <Switch
                  checked={autoSyncHabits}
                  onCheckedChange={setAutoSyncHabits}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
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
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Changes to sync settings will apply to new tasks and habits. 
                Existing items can be synced manually from their respective pages.
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
    </div>
  );
}