import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Brain,
  Clock,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  Star,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users,
  Lightbulb,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  AnalyticsDashboard,
  LearningInsight,
  PerformanceMetrics,
  StudyPattern,
  LearningGoal,
  StudyRecommendation,
  LearningTrend,
} from "@/types/analytics";
import { generateAnalyticsDashboard } from "@/lib/analyticsEngine";

interface PerformanceInsightsProps {
  userId?: string;
  timeRange?: "week" | "month" | "quarter" | "year";
  compact?: boolean;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  userId = "default",
  timeRange = "month",
  compact = false,
}) => {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>("accuracy");
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [userId, timeRange]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const analyticsData = generateAnalyticsDashboard(userId);
      setDashboard(analyticsData);
    } catch (error) {
      console.error("Error loading analytics dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start studying to see your performance insights
        </p>
      </div>
    );
  }

  if (compact) {
    return <CompactInsightsDashboard dashboard={dashboard} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Performance Insights
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Understand your learning patterns and progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={() => {}}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">
                Study Time
              </span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {dashboard.summary.totalStudyTime}m
            </div>
            <p className="text-xs text-gray-500 mt-1">This {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">
                Accuracy
              </span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {Math.round(dashboard.summary.overallAccuracy * 100)}%
            </div>
            <div className="flex items-center mt-1">
              {dashboard.metrics.accuracy.trend
                .slice(-7)
                .reduce((a, b) => a + b, 0) > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              <p className="text-xs text-gray-500">vs last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">
                Current Streak
              </span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {dashboard.summary.currentStreak}
            </div>
            <p className="text-xs text-gray-500 mt-1">Days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">
                Cards Studied
              </span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {dashboard.summary.cardsStudied}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total cards</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="recommendations">Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accuracy Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={dashboard.metrics.accuracy.trend.map(
                      (value, index) => ({
                        day: index + 1,
                        accuracy: value * 100,
                      }),
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        "Accuracy",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Retention Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retention Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Short-term (1 day)</span>
                      <span>
                        {Math.round(
                          dashboard.metrics.retention.shortTerm * 100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={dashboard.metrics.retention.shortTerm * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Medium-term (1 week)</span>
                      <span>
                        {Math.round(
                          dashboard.metrics.retention.mediumTerm * 100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={dashboard.metrics.retention.mediumTerm * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Long-term (1 month)</span>
                      <span>
                        {Math.round(dashboard.metrics.retention.longTerm * 100)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={dashboard.metrics.retention.longTerm * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.metrics.engagement.activeHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {dashboard.insights.length > 0 ? (
            <div className="grid gap-4">
              {dashboard.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No insights yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Keep studying to generate personalized insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {dashboard.patterns.length > 0 ? (
            <div className="grid gap-6">
              {dashboard.patterns.map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No patterns detected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Study more to identify your learning patterns
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-4">
            {dashboard.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {dashboard.recommendations.length > 0 ? (
            <div className="grid gap-4">
              {dashboard.recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  You're doing great!
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No specific recommendations at this time
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Supporting Components
const CompactInsightsDashboard: React.FC<{ dashboard: AnalyticsDashboard }> = ({
  dashboard,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">
            {Math.round(dashboard.summary.overallAccuracy * 100)}%
          </div>
          <p className="text-sm text-gray-500">Accuracy</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">
            {dashboard.summary.currentStreak}
          </div>
          <p className="text-sm text-gray-500">Day Streak</p>
        </CardContent>
      </Card>
    </div>
    {dashboard.insights.slice(0, 2).map((insight) => (
      <InsightCard key={insight.id} insight={insight} compact />
    ))}
  </div>
);

const InsightCard: React.FC<{
  insight: LearningInsight;
  compact?: boolean;
}> = ({ insight, compact = false }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "weakness":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "pattern":
        return <Activity className="w-5 h-5 text-blue-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card className={compact ? "p-3" : ""}>
      <CardContent className={compact ? "p-0" : "p-6"}>
        <div className="flex items-start space-x-3">
          {getInsightIcon(insight.type)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3
                className={`font-medium ${compact ? "text-sm" : "text-base"}`}
              >
                {insight.title}
              </h3>
              <Badge
                variant="outline"
                className={`text-xs ${getSeverityColor(insight.severity)}`}
              >
                {insight.severity}
              </Badge>
            </div>
            <p
              className={`text-gray-600 dark:text-gray-400 ${compact ? "text-xs" : "text-sm"}`}
            >
              {insight.description}
            </p>
            {!compact && insight.actionable && (
              <Button size="sm" className="mt-3">
                Take Action
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PatternCard: React.FC<{ pattern: StudyPattern }> = ({ pattern }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{pattern.name}</CardTitle>
      <p className="text-sm text-gray-500">{pattern.description}</p>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-500">Frequency</div>
          <div className="text-lg font-medium">
            {Math.round(pattern.frequency * 100)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Accuracy Score</div>
          <div className="text-lg font-medium">
            {Math.round(pattern.effectiveness.accuracyScore * 100)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Session Length</div>
          <div className="text-lg font-medium">
            {pattern.pattern.sessionDuration}m
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium">Suggestions:</h4>
        <ul className="space-y-1">
          {pattern.suggestions.map((suggestion, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

const GoalCard: React.FC<{ goal: LearningGoal }> = ({ goal }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">{goal.title}</h3>
          <p className="text-sm text-gray-500">{goal.description}</p>
        </div>
        <Badge
          variant={goal.status === "completed" ? "default" : "outline"}
          className={
            goal.status === "completed"
              ? "bg-green-100 text-green-800"
              : goal.status === "active"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
          }
        >
          {goal.status}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>
            {goal.current.value} / {goal.target.value} {goal.target.unit}
          </span>
        </div>
        <Progress value={goal.current.progress} className="h-2" />
      </div>
    </CardContent>
  </Card>
);

const RecommendationCard: React.FC<{
  recommendation: StudyRecommendation;
}> = ({ recommendation }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20";
      default:
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/20";
    }
  };

  return (
    <Card className={getPriorityColor(recommendation.priority)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{recommendation.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {recommendation.description}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`ml-4 ${
              recommendation.priority === "high"
                ? "border-red-300 text-red-700"
                : recommendation.priority === "medium"
                  ? "border-yellow-300 text-yellow-700"
                  : "border-blue-300 text-blue-700"
            }`}
          >
            {recommendation.priority} priority
          </Badge>
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {recommendation.reasoning}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Estimated benefit: +
            {recommendation.estimatedBenefit.accuracyImprovement}% accuracy
          </div>
          <Button size="sm">Apply Suggestion</Button>
        </div>
      </CardContent>
    </Card>
  );
};
