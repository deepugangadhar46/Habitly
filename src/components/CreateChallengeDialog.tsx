import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { useToast } from '@/hooks/use-toast';

const EMOJI_OPTIONS = [
  '🚀', '🏋️', '📚', '🧘', '🏃', '🎯', '💪', '🎨', '🍎', '💧',
  '🌱', '⚡', '🔥', '🌟', '🎪', '📖', '🧑‍💻', '🏔️', '🎵', '🧩'
];

interface CreateChallengeDialogProps {
  children?: React.ReactNode;
}

export const CreateChallengeDialog = ({ children }: CreateChallengeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [targetDays, setTargetDays] = useState(14);
  const { insertChallenge } = useChallenges();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    try {
      await insertChallenge({ name: name.trim(), description: description.trim(), emoji, targetDays });
      toast({ title: 'Challenge created! 🎯', description: "You're all set to start your challenge!" });
      setOpen(false);
      setName('');
      setDescription('');
      setEmoji('🚀');
      setTargetDays(14);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating challenge:', error);
      toast({ title: 'Error', description: 'Failed to create challenge. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Your Challenge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="challenge-name">Challenge Name</Label>
            <Input id="challenge-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., 30 Day Fitness Challenge" maxLength={50} />
          </div>
          <div>
            <Label htmlFor="challenge-description">Description</Label>
            <Textarea id="challenge-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your challenge and what participants need to do" rows={3} maxLength={200} />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-10 gap-2 mt-2">
              {EMOJI_OPTIONS.map((e) => (
                <Button key={e} type="button" variant={emoji === e ? 'default' : 'outline'} size="sm" className="text-xl p-2 h-auto" onClick={() => setEmoji(e)}>
                  {e}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="challenge-days">Duration (days)</Label>
            <Input id="challenge-days" type="number" value={targetDays} onChange={(e) => setTargetDays(parseInt(e.target.value) || 14)} min="1" max="365" />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-primary hover:shadow-glow">Create Challenge</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
