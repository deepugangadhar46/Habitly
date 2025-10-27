import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Lock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getHabitsWithStreaks } from '@/lib/database';
import { initializeAchievements } from '@/lib/database-enhanced';
import { useAchievements } from '@/hooks/useAchievements';

const Achievements = () => {
  const { achievements, stats, loading, evaluateAndUnlock, refresh } = useAchievements();
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const init = async () => {
      await initializeAchievements();
      await evaluateAndUnlock();
    };
    init();
  }, [evaluateAndUnlock]);

  useEffect(() => {
    const calc = async () => {
      const habits = await getHabitsWithStreaks();
      const points = habits.reduce((sum, h) => sum + h.currentStreak, 0);
      setTotalPoints(points);
    };
    calc();
  }, [achievements]);

  const achievementCategories = [
    {
      title: "Streak Master",
      achievements: achievements.filter(a => a.type === 'streak'),
      color: "bg-gradient-to-r from-orange-400 to-red-500"
    },
    {
      title: "Completion Champion",
      achievements: achievements.filter(a => a.type === 'completion'),
      color: "bg-gradient-to-r from-green-400 to-blue-500"
    },
    {
      title: "Consistency King",
      achievements: achievements.filter(a => a.type === 'consistency'),
      color: "bg-gradient-to-r from-purple-400 to-pink-500"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">🏆</div>
          <p className="text-muted-foreground">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <h1 className="text-3xl font-bold text-foreground">Achievements 🏆</h1>
                <p className="text-muted-foreground">Your milestones and rewards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-success">
            <div className="flex items-center space-x-4">
              <Trophy className="w-8 h-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Unlocked</p>
                <p className="text-3xl font-bold">{stats.unlocked}</p>
                <p className="text-sm text-muted-foreground">of {achievements.length} achievements</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-accent">
            <div className="flex items-center space-x-4">
              <Star className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Keep going!</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-glass">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🎯</div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-3xl font-bold">{achievements.length > 0 ? Math.round((stats.unlocked / achievements.length) * 100) : 0}%</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Achievement Categories */}
        {achievementCategories.map((category) => (
          <div key={category.title} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <span>{category.title}</span>
              <Badge variant="secondary">{category.achievements.length}</Badge>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.achievements.map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt;
                
                return (
                  <Card 
                    key={achievement.id} 
                    className={`p-6 transition-all duration-300 ${
                      isUnlocked 
                        ? 'bg-gradient-success shadow-warm hover:shadow-glow' 
                        : 'bg-gradient-glass opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`text-4xl ${isUnlocked ? '' : 'grayscale'}`}>
                        {isUnlocked ? (
                          <span>{achievement.icon}</span>
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{achievement.name}</h3>
                          {isUnlocked && <Badge className="bg-success text-success-foreground">Unlocked!</Badge>}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {achievement.requirement} {achievement.type === 'streak' ? 'days' : '%'}
                          </Badge>
                          
                          {isUnlocked && achievement.unlockedAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Coming Soon */}
        <Card className="p-8 text-center bg-gradient-glass">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">More Achievements Coming Soon!</h3>
          <p className="text-muted-foreground">
            Keep building those habits and unlock even more rewards!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Achievements;
