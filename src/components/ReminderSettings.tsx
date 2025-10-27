import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Clock } from 'lucide-react';
import { db, Habit } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/notificationService';

interface ReminderSettingsProps {
  habit: Habit;
  onUpdate: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ReminderSettings = ({ habit, onUpdate }: ReminderSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(habit.reminderEnabled || false);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || '09:00');
  const [reminderDays, setReminderDays] = useState<number[]>(habit.reminderDays || [1, 2, 3, 4, 5]); // Mon-Fri default
  const { toast } = useToast();

  const toggleDay = (dayIndex: number) => {
    if (reminderDays.includes(dayIndex)) {
      setReminderDays(reminderDays.filter(d => d !== dayIndex));
    } else {
      setReminderDays([...reminderDays, dayIndex].sort());
    }
  };

  const handleSave = async () => {
    if (reminderEnabled && reminderDays.length === 0) {
      toast({
        title: 'Oops!',
        description: 'Please select at least one day for reminders.',
        variant: 'destructive',
      });
      return;
    }

    // Request notification permission if enabling
    if (reminderEnabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await db.habits.update(habit.id!, {
        reminderEnabled,
        reminderTime,
        reminderDays,
      });

      toast({
        title: reminderEnabled ? 'Reminder Set! ⏰' : 'Reminder Disabled',
        description: reminderEnabled 
          ? `You'll be reminded at ${reminderTime} on selected days`
          : 'Reminders turned off for this habit',
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating reminder:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to save reminder settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-2"
        >
          <Bell className={`w-4 h-4 ${habit.reminderEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
          {habit.reminderEnabled ? 'Reminder On' : 'Set Reminder'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Reminder Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified to complete this habit
              </p>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {reminderEnabled && (
            <>
              {/* Time Picker */}
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Reminder Time
                </Label>
                <input
                  id="time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Days Selection */}
              <div className="space-y-3">
                <Label>Repeat On</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={reminderDays.includes(index) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(index)}
                      className="h-10 w-full p-0"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">Reminder Preview:</p>
                <p className="text-muted-foreground">
                  {habit.emoji} "{habit.name}" at {reminderTime}
                  <br />
                  {reminderDays.length === 7 
                    ? 'Every day'
                    : reminderDays.length === 0
                    ? 'No days selected'
                    : reminderDays.map(d => DAYS[d]).join(', ')}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Reminder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
