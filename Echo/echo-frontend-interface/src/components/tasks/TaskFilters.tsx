import { useState } from 'react';
import { Search, Filter, X, Calendar, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaskFilters as TaskFiltersType, TaskStatus, TaskPriority } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  totalCount: number;
  filteredCount: number;
}

type SortOption = 'created_desc' | 'created_asc' | 'due_date_asc' | 'due_date_desc' | 'priority_desc' | 'priority_asc' | 'title_asc' | 'title_desc';

export function TaskFilters({ filters, onFiltersChange, totalCount, filteredCount }: TaskFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');

  const updateFilter = (key: keyof TaskFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof TaskFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      updateFilter(type === 'from' ? 'due_date_from' : 'due_date_to', isoDate);
    }
    setShowDatePicker(null);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex gap-2 items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => clearFilter('search')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <div className="flex items-center gap-2">
              {sortBy.includes('desc') ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Newest First</SelectItem>
            <SelectItem value="created_asc">Oldest First</SelectItem>
            <SelectItem value="due_date_asc">Due Date (Earliest)</SelectItem>
            <SelectItem value="due_date_desc">Due Date (Latest)</SelectItem>
            <SelectItem value="priority_desc">Priority (High to Low)</SelectItem>
            <SelectItem value="priority_asc">Priority (Low to High)</SelectItem>
            <SelectItem value="title_asc">Title (A to Z)</SelectItem>
            <SelectItem value="title_desc">Title (Z to A)</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => value ? updateFilter('status', value as TaskStatus) : clearFilter('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority || ''}
                  onValueChange={(value) => value ? updateFilter('priority', value as TaskPriority) : clearFilter('priority')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High Priority</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium Priority</SelectItem>
                    <SelectItem value={TaskPriority.LOW}>Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* From Date */}
                  <Popover open={showDatePicker === 'from'} onOpenChange={(open) => setShowDatePicker(open ? 'from' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !filters.due_date_from && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.due_date_from ? format(new Date(filters.due_date_from), "MMM d") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.due_date_from ? new Date(filters.due_date_from) : undefined}
                        onSelect={(date) => handleDateSelect(date, 'from')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* To Date */}
                  <Popover open={showDatePicker === 'to'} onOpenChange={(open) => setShowDatePicker(open ? 'to' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !filters.due_date_to && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.due_date_to ? format(new Date(filters.due_date_to), "MMM d") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.due_date_to ? new Date(filters.due_date_to) : undefined}
                        onSelect={(date) => handleDateSelect(date, 'to')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear Date Filters */}
                {(filters.due_date_from || filters.due_date_to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearFilter('due_date_from');
                      clearFilter('due_date_to');
                    }}
                    className="w-full"
                  >
                    Clear Date Range
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status.replace('_', ' ')}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('status')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {filters.priority}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('priority')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('search')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {(filters.due_date_from || filters.due_date_to) && (
            <Badge variant="secondary" className="gap-1">
              Due: {filters.due_date_from ? format(new Date(filters.due_date_from), 'MMM d') : '...'} - {filters.due_date_to ? format(new Date(filters.due_date_to), 'MMM d') : '...'}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => {
                  clearFilter('due_date_from');
                  clearFilter('due_date_to');
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredCount} of {totalCount} tasks
      </div>
    </div>
  );
}