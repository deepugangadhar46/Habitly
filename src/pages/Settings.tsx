import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bell, Moon, Sun, Download, Upload, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useToast } from '@/hooks/use-toast';
import { db, resetAllData } from '@/lib/database';

const Settings = () => {
  const [notifications, setNotifications] = useState(false);
  const [dailyReminder, setDailyReminder] = useState('09:00');
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('habitly-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotifications(settings.notifications || false);
      setDailyReminder(settings.dailyReminder || '09:00');
      setWeeklyReport(settings.weeklyReport || true);
      setSoundEnabled(settings.soundEnabled || true);
    }
  };

  const saveSettings = () => {
    const settings = {
      notifications,
      dailyReminder,
      weeklyReport,
      soundEnabled
    };
    localStorage.setItem('habitly-settings', JSON.stringify(settings));
    toast({
      title: "Settings saved! ✅",
      description: "Your preferences have been updated.",
    });
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifications(permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifications(permission === 'granted');
      
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled! 🔔",
          description: "You'll receive daily reminders for your habits.",
        });
      } else {
        toast({
          title: "Notifications blocked",
          description: "Enable notifications in your browser settings to receive reminders.",
          variant: "destructive"
        });
      }
    }
  };

  const exportData = async () => {
    try {
      const habits = await db.habits.toArray();
      const entries = await db.entries.toArray();
      
      const exportData = {
        habits,
        entries,
        exportDate: new Date().toISOString(),
        version: '2.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitly-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported! 📁",
        description: "Your habit data has been downloaded as a backup file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive"
      });
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete ALL your habit data? This cannot be undone!')) {
      try {
        await resetAllData();
        
        localStorage.removeItem('habitly-settings');
        
        toast({
          title: "All data cleared! 🗑️",
          description: "Your habit data has been completely removed.",
        });
      } catch (error) {
        toast({
          title: "Clear failed",
          description: "There was an error clearing your data.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-warm shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings ⚙️</h1>
              <p className="text-muted-foreground">Customize your habit tracking experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Notifications */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get reminders for your daily habits</p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={requestNotificationPermission}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="daily-reminder">Daily Reminder Time</Label>
                <p className="text-sm text-muted-foreground">When to send your daily habit reminder</p>
              </div>
              <Input
                id="daily-reminder"
                type="time"
                value={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.value)}
                className="w-32"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-report">Weekly Progress Report</Label>
                <p className="text-sm text-muted-foreground">Receive weekly habit summaries</p>
              </div>
              <Switch
                id="weekly-report"
                checked={weeklyReport}
                onCheckedChange={setWeeklyReport}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds for habit completions</p>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sun className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ModeToggle />
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground">Download a backup of all your habit data</p>
              </div>
              <Button onClick={exportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Clear All Data</Label>
                <p className="text-sm text-muted-foreground text-red-600">
                  Permanently delete all habits and progress
                </p>
              </div>
              <Button onClick={clearAllData} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About Habitly</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Version: 2.0.0</p>
            <p>Build: Enhanced PWA</p>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </Card>

        {/* Save Button */}
        <Button onClick={saveSettings} className="w-full bg-gradient-primary hover:shadow-glow">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
