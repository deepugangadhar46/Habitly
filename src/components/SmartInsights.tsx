import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import { useMoodAnalysis } from '@/hooks/useMoodAnalysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SmartInsightsProps {
  habitId: number;
  habitName: string;
}

interface HabitInsight {
  suggestion: string;
  type: 'time-change' | 'drop-habit' | 'keep-going' | 'time-optimization';
  priority: 'high' | 'medium' | 'low';
}

export const SmartInsights = ({ habitId, habitName }: SmartInsightsProps) => {
  const [insights, setInsights] = useState<HabitInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { getInsights } = useMoodAnalysis(habitId);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const result = await getInsights();
        setInsights(result);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error loading insights:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, [getInsights]);

  if (loading || insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'drop-habit':
        return <TrendingDown className="w-4 h-4" />;
      case 'time-change':
        return <Clock className="w-4 h-4" />;
      case 'keep-going':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getVariant = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'secondary';
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
      <div className="flex items-center space-x-2 mb-3">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-sm">Smart Insights for {habitName}</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <Alert key={index} variant={insight.priority === 'high' ? 'destructive' : 'default'}>
            <div className="flex items-start space-x-2">
              <div className="mt-1">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1">
                <AlertTitle className="text-xs font-medium mb-1">
                  {insight.type === 'drop-habit' && 'Consider Dropping'}
                  {insight.type === 'time-change' && 'Try Different Time'}
                  {insight.type === 'keep-going' && 'Keep It Up!'}
                  {insight.type === 'time-optimization' && 'Optimize Timing'}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {insight.suggestion}
                </AlertDescription>
              </div>
              <Badge variant={getVariant(insight.priority)} className="text-xs">
                {insight.priority}
              </Badge>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
};
