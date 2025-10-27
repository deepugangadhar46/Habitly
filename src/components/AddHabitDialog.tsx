import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/database';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddHabitDialogProps {
  onHabitAdded: () => void;
}

const HABIT_EMOJIS = ['💪', '📚', '🏃‍♂️', '🧘‍♀️', '💧', '🍎', '😴', '🎯', '✍️', '🎵', '🧠', '❤️'];
const HABIT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];

export const AddHabitDialog = ({ onHabitAdded }: AddHabitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💪');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedEmoji('💪');
    setSelectedColor('#FF6B6B');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Oops!",
        description: "Please give your habit a name, cutie! 💕",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await db.habits.add({
        name: name.trim(),
        description: description.trim() || undefined,
        emoji: selectedEmoji,
        color: selectedColor,
        createdAt: new Date(),
        isActive: true
      });
      
      toast({
        title: "Habit Created! 🎉",
        description: `Welcome to your journey with "${name}"! Let's make it happen! ✨`,
      });
      
      resetForm();
      setOpen(false);
      onHabitAdded();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating habit:', error);
      }
      toast({
        title: "Something went wrong",
        description: "Couldn't create your habit. Please try again! 💪",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          Add New Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Create Your New Habit ✨
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label htmlFor="habit-name" className="text-sm font-medium">
              What's your new habit?
            </Label>
            <Input
              id="habit-name"
              placeholder="e.g., Drink 8 glasses of water"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="habit-description" className="text-sm font-medium">
              Why is this important to you? (optional)
            </Label>
            <Textarea
              id="habit-description"
              placeholder="This helps me stay healthy and energized..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>

          {/* Emoji Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose your emoji</Label>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`
                    text-lg p-2 h-auto transition-all duration-200
                    hover:scale-110
                    ${selectedEmoji === emoji ? 'ring-2 ring-primary bg-primary/10' : ''}
                  `}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pick a color</Label>
            <div className="grid grid-cols-4 gap-2">
              {HABIT_COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    h-10 p-0 transition-all duration-200
                    hover:scale-110
                    ${selectedColor === color ? 'ring-2 ring-foreground' : ''}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isSubmitting ? 'Creating...' : `Create "${name || 'Habit'}" ${selectedEmoji}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};