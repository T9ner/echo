import { useState } from 'react';
import { RefreshCw, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductivityMetrics } from './analytics/ProductivityMetrics';
import { AnalyticsCharts } from './analytics/AnalyticsCharts';
import { DateRangeSelector } from './analytics/DateRangeSelector';
import { ProductivityInsights } from './analytics/ProductivityInsights';
import { useDashboardAnalytics } from '@/hooks/useAnalytics';
import { useApiHealth } from '@/hooks/useApiHealth';
import { format } from 'date-fns';

interface DateRange {
  start: Date;
  end: Date;
}

export function AnalyticsView() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });

  // Fetch analytics data
  const {
    productivity,
    habits,
    insights,
    isLoading,
    isError,
    error,
  } = useDashboardAnalytics(dateRange);

  // Check API health
  const { data: healthStatus, isError: healthError } = useApiHealth();

  const handleRefresh = () => {
    productivity.refetch();
    habits.refetch();
    insights.refetch();
  };

  const handleExportData = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      date_range: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      productivity_data: productivity.data,
      habit_data: habits.data,
      insights_data: insights.data,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echo-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateRange = (range: DateRange) => {
    return `${format(range.start, 'MMM d, yyyy')} - ${format(range.end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your productivity patterns and insights</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={isLoading || !productivity.data}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* API Health Warning */}
        {healthError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Unable to connect to the backend API. Analytics data may not be available.
            </AlertDescription>
          </Alert>
        )}

        {/* Date Range Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Failed to load analytics data: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts & Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights & Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Productivity Metrics */}
            <ProductivityMetrics
              data={productivity.data}
              isLoading={productivity.isLoading}
              dateRange={formatDateRange(dateRange)}
            />
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {/* Analytics Charts */}
            <AnalyticsCharts
              productivityData={productivity.data}
              habitData={habits.data}
              isLoading={productivity.isLoading || habits.isLoading}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Productivity Insights */}
            <ProductivityInsights
              data={insights.data}
              isLoading={insights.isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}