import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';
import { db } from '@/lib/database';
import { habitCategories, habitTemplates } from '@/lib/starterHabits';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAddHabitDialogProps {
  onHabitAdded: () => void;
}

export const EnhancedAddHabitDialog = ({ onHabitAdded }: EnhancedAddHabitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('custom');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Custom habit form state
  const [customHabit, setCustomHabit] = useState({
    name: '',
    description: '',
    emoji: '🎯',
    category: 'Health',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    notes: ''
  });

  const resetForm = () => {
    setCustomHabit({
      name: '',
      description: '',
      emoji: '🎯',
      category: 'Health',
      difficulty: 'easy',
      notes: ''
    });
    setActiveTab('custom');
  };

  const createHabit = async (habitData: any) => {
    setIsCreating(true);
    try {
      const categoryData = habitCategories.find(cat => cat.name === habitData.category);
      
      await db.habits.add({
        name: habitData.name,
        description: habitData.description,
        emoji: habitData.emoji,
        color: categoryData?.color || '#3B82F6',
        category: habitData.category,
        difficulty: habitData.difficulty,
        createdAt: new Date(),
        isActive: true,
        notes: habitData.notes
      });

      toast({
        title: "Habit created! 🎉",
        description: `${habitData.emoji} ${habitData.name} is ready to go!`,
      });

      onHabitAdded();
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Oops!",
        description: "Couldn't create habit. Please try again!",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHabit.name.trim()) return;
    createHabit(customHabit);
  };

  const handleTemplateSelect = (template: any, category: string) => {
    const categoryData = habitCategories.find(cat => cat.name === category);
    createHabit({
      ...template,
      category,
      color: categoryData?.color || '#3B82F6'
    });
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Create New Habit</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Habit</TabsTrigger>
            <TabsTrigger value="templates">From Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4">
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Habit Name *</Label>
                  <Input
                    id="name"
                    value={customHabit.name}
                    onChange={(e) => setCustomHabit(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Morning Meditation"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={customHabit.emoji}
                    onChange={(e) => setCustomHabit(prev => ({ ...prev, emoji: e.target.value }))}
                    placeholder="🎯"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={customHabit.description}
                  onChange={(e) => setCustomHabit(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your habit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={customHabit.category} onValueChange={(value) => setCustomHabit(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {habitCategories.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          <div className="flex items-center space-x-2">
                            <span>{category.emoji}</span>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={customHabit.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setCustomHabit(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        <Badge className={difficultyColors.easy}>Easy</Badge>
                      </SelectItem>
                      <SelectItem value="medium">
                        <Badge className={difficultyColors.medium}>Medium</Badge>
                      </SelectItem>
                      <SelectItem value="hard">
                        <Badge className={difficultyColors.hard}>Hard</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Personal Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={customHabit.notes}
                  onChange={(e) => setCustomHabit(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Why is this habit important to you?"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={!customHabit.name.trim() || isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Create Habit'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-6">
              {habitTemplates.map((category) => (
                <div key={category.category}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <span>{habitCategories.find(cat => cat.name === category.category)?.emoji}</span>
                    <span>{category.category}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.habits.map((habit, index) => (
                      <Card 
                        key={index} 
                        className="p-4 cursor-pointer hover:shadow-soft transition-all duration-200 hover:bg-secondary/20"
                        onClick={() => handleTemplateSelect(habit, category.category)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{habit.emoji}</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{habit.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{habit.description}</p>
                            <Badge className={difficultyColors[habit.difficulty as keyof typeof difficultyColors]}>
                              {habit.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
