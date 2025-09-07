import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, Plus, Calendar, TrendingUp } from 'lucide-react';
import { enhancedDb, Goal } from '@/lib/database-enhanced';
import { getHabitsWithStreaks } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const GoalTracker = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    habitId: 0,
    type: 'weekly' as 'weekly' | 'monthly',
    target: 7
  });
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
    loadHabits();
  }, []);

  const loadGoals = async () => {
    try {
      const allGoals = await enhancedDb.goals.toArray();
      setGoals(allGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadHabits = async () => {
    try {
      const habitsWithStreaks = await getHabitsWithStreaks();
      setHabits(habitsWithStreaks);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const createGoal = async () => {
    if (!newGoal.habitId || !newGoal.target) return;

    try {
      const now = new Date();
      const period = newGoal.type === 'weekly' 
        ? format(startOfWeek(now), 'yyyy-ww')
        : format(startOfMonth(now), 'yyyy-MM');

      await enhancedDb.goals.add({
        habitId: newGoal.habitId,
        type: newGoal.type,
        target: newGoal.target,
        period,
        achieved: false,
        createdAt: now
      });

      toast({
        title: "Goal created! 🎯",
        description: `New ${newGoal.type} goal set successfully!`,
      });

      setShowCreateDialog(false);
      setNewGoal({ habitId: 0, type: 'weekly', target: 7 });
      loadGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const calculateProgress = (goal: Goal): number => {
    // Mock calculation - in real app would calculate from entries
    return Math.floor(Math.random() * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Target className="w-6 h-6" />
          <span>Goals</span>
        </h2>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Set Goal
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Habit</Label>
                <Select value={newGoal.habitId.toString()} onValueChange={(value) => setNewGoal(prev => ({ ...prev, habitId: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a habit" />
                  </SelectTrigger>
                  <SelectContent>
                    {habits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{habit.emoji}</span>
                          <span>{habit.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Goal Type</Label>
                <Select value={newGoal.type} onValueChange={(value: 'weekly' | 'monthly') => setNewGoal(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Goal</SelectItem>
                    <SelectItem value="monthly">Monthly Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Target Days</Label>
                <Input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) }))}
                  min="1"
                  max={newGoal.type === 'weekly' ? 7 : 31}
                />
              </div>
              
              <Button onClick={createGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-glass">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
          <p className="text-muted-foreground mb-4">
            Set weekly or monthly goals to stay motivated!
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const habit = habits.find(h => h.id === goal.habitId);
            const progress = calculateProgress(goal);
            const isAchieved = progress >= 100;
            
            if (!habit) return null;
            
            return (
              <Card key={goal.id} className={`p-6 ${isAchieved ? 'bg-gradient-success' : 'bg-gradient-glass'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{habit.emoji}</span>
                    <div>
                      <h3 className="font-semibold">{habit.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {goal.type === 'weekly' ? 'Weekly' : 'Monthly'} Goal: {goal.target} days
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={isAchieved ? "default" : "secondary"}>
                      {Math.floor(progress * goal.target / 100)}/{goal.target}
                    </Badge>
                    {isAchieved && <Badge className="bg-success text-success-foreground">Achieved!</Badge>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Period: {goal.period}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{Math.floor(progress * goal.target / 100)} completed</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
