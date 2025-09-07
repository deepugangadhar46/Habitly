import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, Users, Target, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { enhancedDb, Challenge } from '@/lib/database-enhanced';
import { getHabitsWithStreaks } from '@/lib/database';
import { format, differenceInDays } from 'date-fns';

const Challenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
    initializeDefaultChallenges();
  }, []);

  const initializeDefaultChallenges = async () => {
    const existingCount = await enhancedDb.challenges.count();
    if (existingCount > 0) return;

    const defaultChallenges: Challenge[] = [
      {
        name: "New Year, New Me",
        description: "Complete any 3 habits for 30 days straight",
        emoji: "🎯",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetDays: 30,
        habitIds: [],
        isActive: true,
        participants: 1247
      },
      {
        name: "Mindful March",
        description: "Focus on mindfulness and meditation habits",
        emoji: "🧘‍♀️",
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        targetDays: 21,
        habitIds: [],
        isActive: true,
        participants: 892
      },
      {
        name: "Fitness February",
        description: "Stay active with daily exercise habits",
        emoji: "💪",
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        targetDays: 28,
        habitIds: [],
        isActive: true,
        participants: 1563
      }
    ];

    await enhancedDb.challenges.bulkAdd(defaultChallenges);
  };

  const loadChallenges = async () => {
    try {
      const allChallenges = await enhancedDb.challenges.toArray();
      setChallenges(allChallenges);
      
      const now = new Date();
      const active = allChallenges.filter(c => c.isActive && c.endDate > now);
      const completed = allChallenges.filter(c => !c.isActive || c.endDate <= now);
      
      setActiveChallenges(active);
      setCompletedChallenges(completed);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinChallenge = async (challengeId: number) => {
    try {
      const challenge = await enhancedDb.challenges.get(challengeId);
      if (challenge) {
        await enhancedDb.challenges.update(challengeId, {
          participants: (challenge.participants || 0) + 1
        });
        loadChallenges();
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const calculateProgress = (challenge: Challenge): number => {
    const now = new Date();
    const totalDays = differenceInDays(challenge.endDate, challenge.startDate);
    const daysPassed = differenceInDays(now, challenge.startDate);
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">🎯</div>
          <p className="text-muted-foreground">Loading challenges...</p>
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
                <h1 className="text-3xl font-bold text-foreground">Challenges 🎯</h1>
                <p className="text-muted-foreground">Join community challenges and stay motivated</p>
              </div>
            </div>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Active Challenges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <span>Active Challenges</span>
            <Badge variant="secondary">{activeChallenges.length}</Badge>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChallenges.map((challenge) => {
              const progress = calculateProgress(challenge);
              const daysLeft = Math.max(0, differenceInDays(challenge.endDate, new Date()));
              
              return (
                <Card key={challenge.id} className="p-6 bg-gradient-glass hover:shadow-warm transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{challenge.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{challenge.name}</h3>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{daysLeft} days left</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{challenge.participants || 0} joined</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        <Target className="w-3 h-3 mr-1" />
                        {challenge.targetDays} days
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => joinChallenge(challenge.id!)}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        Join Challenge
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <span>Completed Challenges</span>
              <Badge variant="secondary">{completedChallenges.length}</Badge>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedChallenges.map((challenge) => (
                <Card key={challenge.id} className="p-6 bg-gradient-success opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{challenge.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{challenge.name}</h3>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                    <Badge className="bg-success text-success-foreground">Completed</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Ended {format(challenge.endDate, 'MMM dd, yyyy')}</span>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{challenge.participants || 0} participants</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create Your Own */}
        <Card className="p-8 text-center bg-gradient-glass">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Create Your Own Challenge</h3>
          <p className="text-muted-foreground mb-6">
            Design a custom challenge and invite friends to join you!
          </p>
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Challenges;
