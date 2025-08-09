import { Lightbulb, TrendingUp, AlertCircle, CheckCircle, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductivityInsights as ProductivityInsightsType } from '@/types';

interface ProductivityInsightsProps {
  data?: ProductivityInsightsType;
  isLoading?: boolean;
}

export function ProductivityInsights({ data, isLoading }: ProductivityInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No insights available yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete more tasks and build habits to get personalized insights
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPatternIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'productivity':
        return <TrendingUp className="h-4 w-4" />;
      case 'habit':
        return <Target className="h-4 w-4" />;
      case 'time':
        return <Clock className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPatternColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      {data.insights && data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.map((insight, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {insight}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <Alert key={index} className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {recommendation}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Patterns */}
      {data.patterns && data.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Detected Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.patterns.map((pattern, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPatternIcon(pattern.type)}
                    <span className="font-medium text-gray-900 capitalize">
                      {pattern.type} Pattern
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getPatternColor(pattern.confidence)}
                  >
                    {getConfidenceLabel(pattern.confidence)}
                  </Badge>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {pattern.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(pattern.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!data.insights || data.insights.length === 0) && 
       (!data.recommendations || data.recommendations.length === 0) && 
       (!data.patterns || data.patterns.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Building Your Insights
            </h3>
            <p className="text-gray-600 mb-4">
              We're analyzing your productivity patterns. Keep using ECHO to unlock personalized insights and recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Complete Tasks</p>
                <p className="text-xs text-gray-500">Track your progress</p>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Build Habits</p>
                <p className="text-xs text-gray-500">Create consistency</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Track Patterns</p>
                <p className="text-xs text-gray-500">Discover insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}