import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HabitFilters as HabitFiltersType, HabitFrequency } from '@/types';

interface HabitFiltersProps {
  filters: HabitFiltersType;
  onFiltersChange: (filters: HabitFiltersType) => void;
  totalCount: number;
  filteredCount: number;
}

export function HabitFilters({ filters, onFiltersChange, totalCount, filteredCount }: HabitFiltersProps) {
  const updateFilter = (key: keyof HabitFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof HabitFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex gap-2 items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search habits..."
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

              {/* Frequency Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select
                  value={filters.frequency || ''}
                  onValueChange={(value) => value ? updateFilter('frequency', value as HabitFrequency) : clearFilter('frequency')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All frequencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Frequencies</SelectItem>
                    <SelectItem value={HabitFrequency.DAILY}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        Daily
                      </div>
                    </SelectItem>
                    <SelectItem value={HabitFrequency.WEEKLY}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        Weekly
                      </div>
                    </SelectItem>
                    <SelectItem value={HabitFrequency.CUSTOM}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        Custom
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Filter Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would filter for habits with active streaks
                      // For now, just clear filters as an example
                      clearAllFilters();
                    }}
                  >
                    Active Streaks
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would filter for habits that need attention
                      clearAllFilters();
                    }}
                  >
                    Needs Attention
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.frequency && (
            <Badge variant="secondary" className="gap-1">
              Frequency: {filters.frequency}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('frequency')}
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
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredCount} of {totalCount} habits
      </div>
    </div>
  );
}