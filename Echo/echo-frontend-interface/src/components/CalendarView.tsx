import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: number;
  title: string;
  time: string;
  duration: string;
  location?: string;
  type: 'meeting' | 'task' | 'personal';
  date: string;
}

export function CalendarView() {
  const [currentDate] = useState(new Date());
  const [events] = useState<Event[]>([
    {
      id: 1,
      title: 'Team Standup',
      time: '09:00',
      duration: '30 min',
      location: 'Conference Room A',
      type: 'meeting',
      date: '2024-01-16'
    },
    {
      id: 2,
      title: 'Client Presentation',
      time: '14:00',
      duration: '1 hour',
      location: 'Zoom',
      type: 'meeting',
      date: '2024-01-17'
    },
    {
      id: 3,
      title: 'Code Review',
      time: '11:00',
      duration: '45 min',
      type: 'task',
      date: '2024-01-18'
    },
    {
      id: 4,
      title: 'Lunch with Sarah',
      time: '12:30',
      duration: '1 hour',
      location: 'Downtown Cafe',
      type: 'personal',
      date: '2024-01-19'
    }
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-primary text-primary-foreground';
      case 'task':
        return 'bg-warning text-warning-foreground';
      case 'personal':
        return 'bg-success text-success-foreground';
    }
  };

  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="h-full p-6 space-y-6 bg-gradient-glow">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-border">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((day, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg transition-colors cursor-pointer
                      ${day ? 'hover:bg-accent text-foreground' : ''}
                      ${day === 16 ? 'bg-primary text-primary-foreground font-bold shadow-glow' : ''}
                    `}
                  >
                    {day && (
                      <div className="text-center">
                        <div>{day}</div>
                        {day === 16 && <div className="w-1 h-1 bg-primary-foreground rounded-full mt-1 mx-auto"></div>}
                        {day === 17 && <div className="w-1 h-1 bg-primary rounded-full mt-1 mx-auto"></div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Upcoming Events</CardTitle>
              <CardDescription>Your schedule for the next few days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {event.time} • {event.duration}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                    <div className="text-xs">{event.date}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}