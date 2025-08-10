import { TrendingUp, Target, Clock, CheckCircle, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProductivityAnalytics } from '@/types';

interface ProductivityMetricsProps {
  data?: ProductivityAnalytics;
  isLoading?: boolean;
  dateRange?: string;
}

export function ProductivityMetrics({ data, isLoading, dateRange }: ProductivityMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No productivity data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from the correct structure
  const totalTasks = data.tasks?.total_tasks || 0;
  const completedTasks = data.tasks?.completed_tasks || 0;
  const completionRate = data.tasks?.completion_rate || 0;
  const averageCompletionTime = data.tasks?.average_completion_time_hours || 0;
  const productivityScore = data.overall_score?.overall_score || 0;

  const getProductivityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTime = (hours: number) => {
    if (!hours || hours === 0) return 'No data';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours % 1) * 60);
    return mins > 0 ? `${wholeHours}h ${mins}m` : `${wholeHours}h`;
  };

  const getMostProductiveHour = () => {
    // For now, return "No data" since this field isn't in the current API response
    return 'No data';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              {completedTasks} completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {isNaN(completionRate) ? '0' : Math.round(completionRate)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <Progress 
            value={isNaN(completionRate) ? 0 : completionRate} 
            className="h-2"
          />
          <div className="mt-2">
            <Badge 
              variant={completionRate >= 80 ? 'default' : 'secondary'}
              className={completionRate >= 80 ? 'bg-green-500' : ''}
            >
              {completionRate >= 80 ? 'Excellent' : 
               completionRate >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Average Completion Time */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatTime(averageCompletionTime)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Per task completion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productivity Score</p>
              <p className={`text-3xl font-bold ${getProductivityScoreColor(productivityScore)}`}>
                {isNaN(productivityScore) ? '0' : Math.round(productivityScore)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              Peak: {getMostProductiveHour()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}