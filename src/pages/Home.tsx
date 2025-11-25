import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/HabitCard';
import { EnhancedAddHabitDialog } from '@/components/EnhancedAddHabitDialog';
import { SmartInsights } from '@/components/SmartInsights';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const [habitToDelete, setHabitToDelete] = useState<number | null>(null);
  const {
    loading,
    habits,
    todayEntries,
    insertHabit,
    duplicateHabit,
    archiveHabit,
    deleteHabit,
    completeHabit,
    updateCompletionMood,
    refresh,
  } = useHabits();
  const { toast } = useToast();

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async () => {
    if (!habitToDelete) return;
    await deleteHabit(habitToDelete);
    setHabitToDelete(null);
    toast({
      title: "Habit deleted",
      description: "The habit and all its data have been permanently removed.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">🏠</div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-warm shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Your Habits</h1>
                <p className="text-muted-foreground">Tap to complete. Everything saves offline.</p>
              </div>
            </div>
            <EnhancedAddHabitDialog onHabitAdded={refresh} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {habits.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-glass">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Create your first habit</h3>
            <p className="text-muted-foreground mb-6">Track anything: fitness, mindfulness, study and more.</p>
            <EnhancedAddHabitDialog onHabitAdded={refresh} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((h) => (
              <div key={h.id} className="space-y-2">
                <HabitCard
                  habit={h}
                  todayEntry={todayEntries[h.id!]}
                  onUpdate={refresh}
                />
                {h.id && <SmartInsights habitId={h.id} habitName={h.name} />}
                <div className="flex items-center justify-end gap-2 p-2 border border-border rounded-lg bg-card">
                  <Button size="sm" variant="outline" onClick={() => duplicateHabit(h.id!)}>
                    <span className="text-xs">Duplicate</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => archiveHabit(h.id!)}>
                    <span className="text-xs">Retire</span>
                  </Button>
                  <AlertDialog open={habitToDelete === h.id} onOpenChange={(open) => !open && setHabitToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setHabitToDelete(h.id!);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-xs">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-destructive" />
                          <span>Delete Habit?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{h.name}"? This action cannot be undone and will permanently delete all completion history for this habit.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setHabitToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            handleDelete();
                            setHabitToDelete(null);
                          }} 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
