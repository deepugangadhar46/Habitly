import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Target, Plus, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { db, getHabitsWithStreaks, Goal, createGoal as dbCreateGoal, deleteGoal as dbDeleteGoal, getGoalProgress } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isSameWeek, isSameMonth, parseISO } from 'date-fns';

interface GoalWithProgress extends Goal {
  currentProgress: number;
  totalDays: number;
}

// COMMENTED OUT - Goal feature disabled for now, will revisit later
// export const GoalTracker = () => {
const GoalTracker = () => {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
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
    
    // Subscribe to storage changes to refresh when habit is marked as done
    const interval = setInterval(() => {
      if (import.meta.env.DEV) {
        console.log('🔄 Refreshing goals...');
      }
      loadGoals();
    }, 500); // Check every 500ms for faster updates
    
    return () => clearInterval(interval);
  }, []);

  const loadGoals = async () => {
    try {
      const allGoals = await db.goals.toArray();
      const allEntries = await db.entries.toArray();
      
      if (import.meta.env.DEV) {
        console.log('📊 Loading goals:', {
          totalGoals: allGoals.length,
          totalEntries: allEntries.length,
          completedEntries: allEntries.filter(e => e.completed).length
        });
      }
      
      const goalsWithProgress: GoalWithProgress[] = allGoals.map(goal => {
        let completedDays = 0;
        const totalDays = goal.target;
        
        try {
          // Find all COMPLETED entries for this specific habit
          const habitEntries = allEntries.filter(e => {
            return e.habitId === goal.habitId && e.completed === true;
          });
          
          if (import.meta.env.DEV) {
            console.log(`📌 Goal for habit ${goal.habitId}:`, {
              habitId: goal.habitId,
              completedEntries: habitEntries.length,
              period: goal.period,
              type: goal.type,
              target: goal.target
            });
          }
          
          // Filter entries based on the goal period
          if (goal.type === 'weekly') {
            const periodStart = parseISO(goal.period);
            const periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
            
            const filteredEntries = habitEntries.filter(e => {
              try {
                const entryDate = parseISO(e.date);
                return entryDate >= periodStart && entryDate <= periodEnd;
              } catch {
                return false;
              }
            });
            
            // Count unique dates (one per day max)
            const uniqueDates = new Set(filteredEntries.map(e => e.date));
            completedDays = uniqueDates.size;
            
            if (import.meta.env.DEV) {
              console.log(`✅ Weekly goal - Period: ${goal.period} to ${format(periodEnd, 'yyyy-MM-dd')}, Completed days: ${completedDays}`);
            }
          } else if (goal.type === 'monthly') {
            // Parse YYYY-MM format
            const parts = goal.period.split('-');
            if (parts.length >= 2) {
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              const periodStart = new Date(year, month - 1, 1);
              const periodEnd = new Date(year, month, 0);
              
              const filteredEntries = habitEntries.filter(e => {
                try {
                  const entryDate = parseISO(e.date);
                  return entryDate >= periodStart && entryDate <= periodEnd;
                } catch {
                  return false;
                }
              });
              
              // Count unique dates (one per day max)
              const uniqueDates = new Set(filteredEntries.map(e => e.date));
              completedDays = uniqueDates.size;
              
              if (import.meta.env.DEV) {
                console.log(`📅 Monthly goal - Period: ${goal.period}, Completed days: ${completedDays}`);
              }
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error(`Error processing goal for habit ${goal.habitId}:`, e);
          }
          completedDays = 0;
        }
        
        return {
          ...goal,
          currentProgress: completedDays,
          totalDays: totalDays
        };
      });
      
      setGoals(goalsWithProgress);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error loading goals:', error);
      }
    }
  };

  const loadHabits = async () => {
    try {
      const habitsWithStreaks = await getHabitsWithStreaks();
      setHabits(habitsWithStreaks);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading habits:', error);
      }
    }
  };

  const createGoal = async () => {
    if (!newGoal.habitId || !newGoal.target) return;

    try {
      const now = new Date();
      let period = '';
      
      if (newGoal.type === 'weekly') {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        period = format(weekStart, 'yyyy-MM-dd');
      } else {
        period = format(startOfMonth(now), 'yyyy-MM');
      }

      await dbCreateGoal(newGoal.habitId, newGoal.type, newGoal.target, period);

      toast({
        title: "Goal created! 🎯",
        description: `New ${newGoal.type} goal set successfully!`,
      });

      setShowCreateDialog(false);
      setNewGoal({ habitId: 0, type: 'weekly', target: 7 });
      loadGoals();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating goal:', error);
      }
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const calculateProgress = (goal: GoalWithProgress): number => {
    if (!goal.totalDays || goal.totalDays === 0) return 0;
    return Math.round((goal.currentProgress / goal.totalDays) * 100);
  };

  const deleteGoal = async (goalId: number) => {
    try {
      await dbDeleteGoal(goalId);
      toast({
        title: "Goal deleted",
        description: "The goal has been removed.",
      });
      loadGoals();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting goal:', error);
      }
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive"
      });
    }
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
                      {goal.currentProgress}/{goal.totalDays}
                    </Badge>
                    {isAchieved && <Badge className="bg-success text-success-foreground">Achieved!</Badge>}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this goal? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteGoal(goal.id!)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                    <span>{goal.currentProgress} completed</span>
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
