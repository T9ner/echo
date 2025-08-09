import { TrendingUp, Target, Clock, CheckCircle, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProductivityAnalytics } from '@/types';

interface ProductivityMetricsProps {
  data?: ProductivityAnalytics;
  isLoading?: boolean;
}

export function ProductivityMetrics({ data, isLoading }: ProductivityMetricsProps) {
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getMostProductiveHour = () => {
    if (!data.most_productive_hours || data.most_productive_hours.length === 0) {
      return 'No data';
    }
    const hour = data.most_productive_hours[0];
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{data.total_tasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              {data.completed_tasks} completed
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
                {Math.round(data.completion_rate)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <Progress 
            value={data.completion_rate} 
            className="h-2"
            // @ts-ignore - custom color prop
            color={getCompletionRateColor(data.completion_rate)}
          />
          <div className="mt-2">
            <Badge 
              variant={data.completion_rate >= 80 ? 'default' : 'secondary'}
              className={data.completion_rate >= 80 ? 'bg-green-500' : ''}
            >
              {data.completion_rate >= 80 ? 'Excellent' : 
               data.completion_rate >= 60 ? 'Good' : 'Needs Improvement'}
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
                {formatTime(data.average_completion_time)}
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
              <p className={`text-3xl font-bold ${getProductivityScoreColor(data.productivity_score)}`}>
                {Math.round(data.productivity_score)}
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