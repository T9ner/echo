/**
 * EventList Component - Display list of events
 * 
 * Features:
 * - List view of events
 * - Filtering and sorting
 * - Pagination
 * - Search functionality
 * - Compact and detailed views
 * - Loading states
 */
import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Event, EventType, EventStatus, EventFilter } from '@/types';
import EventCard from './EventCard';

interface EventListProps {
  events: Event[];
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (eventId: string) => void;
  onEventView?: (event: Event) => void;
  onFilterChange?: (filter: EventFilter) => void;
  isLoading?: boolean;
  compact?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

type SortOption = 'start_time' | 'title' | 'event_type' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function EventList({
  events,
  onEventEdit,
  onEventDelete,
  onEventView,
  onFilterChange,
  isLoading = false,
  compact = false,
  showFilters = true,
  showSearch = true,
  title = 'Events',
  emptyMessage = 'No events found',
  className
}: EventListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('start_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedType);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }
    
    // Sort events
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'start_time':
          aValue = new Date(a.start_time);
          bValue = new Date(b.start_time);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'event_type':
          aValue = a.event_type;
          bValue = b.event_type;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.start_time;
          bValue = b.start_time;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [events, searchQuery, selectedType, selectedStatus, sortBy, sortDirection]);
  
  // Update parent filter when local filters change
  React.useEffect(() => {
    if (onFilterChange) {
      const filter: EventFilter = {};
      
      if (searchQuery.trim()) {
        filter.search = searchQuery.trim();
      }
      
      if (selectedType !== 'all') {
        filter.event_type = selectedType;
      }
      
      if (selectedStatus !== 'all') {
        filter.status = selectedStatus;
      }
      
      onFilterChange(filter);
    }
  }, [searchQuery, selectedType, selectedStatus, onFilterChange]);
  
  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSortBy('start_time');
    setSortDirection('asc');
  };
  
  const hasActiveFilters = searchQuery.trim() || selectedType !== 'all' || selectedStatus !== 'all';
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {filteredAndSortedEvents.length}
            </Badge>
          </CardTitle>
          
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFiltersPanel ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {/* Filters Panel */}
        {showFilters && showFiltersPanel && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Event Type</label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as EventType | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={EventType.MEETING}>Meeting</SelectItem>
                    <SelectItem value={EventType.TASK}>Task</SelectItem>
                    <SelectItem value={EventType.PERSONAL}>Personal</SelectItem>
                    <SelectItem value={EventType.REMINDER}>Reminder</SelectItem>
                    <SelectItem value={EventType.APPOINTMENT}>Appointment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as EventStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={EventStatus.SCHEDULED}>Scheduled</SelectItem>
                    <SelectItem value={EventStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={EventStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={EventStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select
                  value={`${sortBy}-${sortDirection}`}
                  onValueChange={(value) => {
                    const [newSortBy, newDirection] = value.split('-') as [SortOption, SortDirection];
                    setSortBy(newSortBy);
                    setSortDirection(newDirection);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start_time-asc">Start Time (Earliest)</SelectItem>
                    <SelectItem value="start_time-desc">Start Time (Latest)</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="event_type-asc">Type (A-Z)</SelectItem>
                    <SelectItem value="event_type-desc">Type (Z-A)</SelectItem>
                    <SelectItem value="created_at-desc">Recently Created</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {hasActiveFilters && (
                  <span>
                    Showing {filteredAndSortedEvents.length} of {events.length} events
                  </span>
                )}
              </div>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={cn('space-y-3', { 'space-y-2': compact })}>
            {filteredAndSortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={onEventEdit}
                onDelete={onEventDelete}
                onView={onEventView}
                compact={compact}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventList;