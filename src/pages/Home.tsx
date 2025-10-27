import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/HabitCard';
import { EnhancedAddHabitDialog } from '@/components/EnhancedAddHabitDialog';

const Home = () => {
  const {
    loading,
    habits,
    todayEntries,
    insertHabit,
    duplicateHabit,
    archiveHabit,
    completeHabit,
    updateCompletionMood,
    refresh,
  } = useHabits();

  useEffect(() => { refresh(); }, [refresh]);

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
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => duplicateHabit(h.id!)}>Duplicate</Button>
                  <Button size="sm" variant="ghost" onClick={() => archiveHabit(h.id!)}>Retire</Button>
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
