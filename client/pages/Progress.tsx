import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, BarChart3, Calendar } from "lucide-react";

export default function Progress() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Progress Tracking</h1>
            <p className="text-muted-foreground">
              Monitor your learning journey and achievements
            </p>
          </div>
        </div>

        <Card className="text-center py-20">
          <CardContent>
            <TrendingUp className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">
              Progress Analytics Coming Soon
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Track your study streaks, accuracy rates, and learning patterns.
              Identify your strengths and areas for improvement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <BarChart3 className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Detailed Charts</h3>
                <p className="text-sm text-muted-foreground">
                  Visual progress tracking
                </p>
              </div>
              <div className="space-y-2">
                <Calendar className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Study Streaks</h3>
                <p className="text-sm text-muted-foreground">
                  Build consistent habits
                </p>
              </div>
              <div className="space-y-2">
                <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Performance Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Improve your learning
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Link to="/study">
                <Button className="gradient-bg">Continue Studying</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
