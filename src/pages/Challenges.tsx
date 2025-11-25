import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, Users, Target, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/database';
import { format, differenceInDays } from 'date-fns';
import { useChallenges } from '@/hooks/useChallenges';
import { CreateChallengeDialog } from '@/components/CreateChallengeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const Challenges = () => {
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [deletingChallengeId, setDeletingChallengeId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const {
    loading: isLoading,
    activeChallenges,
    completedChallenges,
    enrollChallenge,
    leaveChallenge,
    insertChallenge,
    refresh,
  } = useChallenges();

  useEffect(() => {
    initializeDefaultChallenges();
  }, [refresh]);

  const initializeDefaultChallenges = async () => {
    const existingCount = await db.challenges.count();
    if (existingCount > 0) return;

    const defaultChallenges: any[] = [
      {
        name: "New Year, New Me",
        description: "Complete any 3 habits for 30 days straight",
        emoji: "🎯",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetDays: 30,
        habitIds: [],
        isActive: true,
        participants: 1247,
        isJoined: false,
        completedDates: []
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
        participants: 892,
        isJoined: false,
        completedDates: []
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
        participants: 1563,
        isJoined: false,
        completedDates: []
      }
    ];

    await db.challenges.bulkAdd(defaultChallenges);
    await refresh();
  };

  const calculateProgress = (challenge: { progressPercent?: number }) => challenge.progressPercent ?? 0;
  
  const handleDeleteChallenge = async (challengeId: number) => {
    try {
      await db.challenges.delete(challengeId);
      toast({
        title: "Challenge deleted",
        description: "The challenge has been permanently removed.",
      });
      await refresh();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting challenge:', error);
      }
      toast({
        title: "Error",
        description: "Failed to delete challenge. Please try again.",
        variant: "destructive"
      });
    }
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
            <CreateChallengeDialog />
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
                      <div className="flex items-center space-x-2">
                        {challenge.isJoined ? (
                          <Button 
                            size="sm"
                            variant="secondary"
                            onClick={() => leaveChallenge(challenge.id!)}
                          >
                            Joined • Leave
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => enrollChallenge(challenge.id!)}
                            className="bg-gradient-primary hover:shadow-glow"
                          >
                            Join Challenge
                          </Button>
                        )}
                        {challenge.name !== 'New Year, New Me' && 
                         challenge.name !== 'Mindful March' && 
                         challenge.name !== 'Fitness February' && (
                          <AlertDialog open={deletingChallengeId === challenge.id} onOpenChange={(open) => !open && setDeletingChallengeId(null)}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingChallengeId(challenge.id!);
                                }}
                                className="hover:bg-destructive/90"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                <span className="text-xs">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Challenge?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{challenge.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletingChallengeId(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => {
                                    handleDeleteChallenge(challenge.id!);
                                    setDeletingChallengeId(null);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
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
          <Button className="bg-gradient-primary hover:shadow-glow" onClick={() => insertChallenge({
            name: 'Custom Challenge',
            description: 'Your own challenge',
            emoji: '🚀',
            targetDays: 14,
          })}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Challenges;
