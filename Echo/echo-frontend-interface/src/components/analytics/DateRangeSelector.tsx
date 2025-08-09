import { useState } from 'react';
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presetRanges = [
  {
    label: 'Last 7 days',
    value: 'last7days',
    getRange: () => ({
      start: subDays(new Date(), 6),
      end: new Date(),
    }),
  },
  {
    label: 'Last 14 days',
    value: 'last14days',
    getRange: () => ({
      start: subDays(new Date(), 13),
      end: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    value: 'last30days',
    getRange: () => ({
      start: subDays(new Date(), 29),
      end: new Date(),
    }),
  },
  {
    label: 'This week',
    value: 'thisweek',
    getRange: () => ({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: new Date(),
    }),
  },
  {
    label: 'Last week',
    value: 'lastweek',
    getRange: () => {
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      return {
        start: lastWeekStart,
        end: subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1),
      };
    },
  },
  {
    label: 'This month',
    value: 'thismonth',
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: new Date(),
    }),
  },
  {
    label: 'Last month',
    value: 'lastmonth',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: subDays(startOfMonth(new Date()), 1),
      };
    },
  },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('last30days');

  const handlePresetChange = (presetValue: string) => {
    const preset = presetRanges.find(p => p.value === presetValue);
    if (preset) {
      const range = preset.getRange();
      onChange(range);
      setSelectedPreset(presetValue);
    }
  };

  const handleCustomDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;
    
    const newRange = {
      ...value,
      [type]: date,
    };
    
    // Ensure start date is not after end date
    if (type === 'start' && date > value.end) {
      newRange.end = date;
    } else if (type === 'end' && date < value.start) {
      newRange.start = date;
    }
    
    onChange(newRange);
    setSelectedPreset('custom');
  };

  const formatDateRange = () => {
    return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Preset Selector */}
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Start Date Calendar */}
            <div className="p-3 border-r">
              <div className="text-sm font-medium mb-2">Start Date</div>
              <Calendar
                mode="single"
                selected={value.start}
                onSelect={(date) => handleCustomDateChange(date, 'start')}
                disabled={(date) => date > new Date() || date > value.end}
                initialFocus
              />
            </div>
            
            {/* End Date Calendar */}
            <div className="p-3">
              <div className="text-sm font-medium mb-2">End Date</div>
              <Calendar
                mode="single"
                selected={value.end}
                onSelect={(date) => handleCustomDateChange(date, 'end')}
                disabled={(date) => date > new Date() || date < value.start}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const range = presetRanges.find(p => p.value === 'last7days')?.getRange();
                  if (range) {
                    onChange(range);
                    setSelectedPreset('last7days');
                  }
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const range = presetRanges.find(p => p.value === 'last30days')?.getRange();
                  if (range) {
                    onChange(range);
                    setSelectedPreset('last30days');
                  }
                }}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}