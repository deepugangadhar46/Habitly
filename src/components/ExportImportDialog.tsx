import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database } from 'lucide-react';

interface ExportImportDialogProps {
  onImported?: () => void;
}

export const ExportImportDialog = ({ onImported }: ExportImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const exportData = async () => {
    setIsExporting(true);
    try {
      const habits = await db.habits.toArray();
      const entries = await db.entries.toArray();
      const quotes = await db.quotes.toArray();
      
      const exportObj = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          habits,
          entries,
          quotes
        }
      };

      const dataStr = JSON.stringify(exportObj, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup created! 📱",
        description: "Your habits are safely exported. Keep this file secure! ✨",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Export error:', error);
      }
      toast({
        title: "Export failed",
        description: "Couldn't create backup. Please try again! 😔",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importHabits = async () => {
    if (!importData.trim()) {
      toast({
        title: "No data to import",
        description: "Please paste your backup data first! 📋",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const parsedData = JSON.parse(importData);
      
      if (!parsedData.data || !parsedData.data.habits) {
        throw new Error('Invalid backup format');
      }

      // Clear existing data (optional - could ask user)
      await db.transaction('rw', db.habits, db.entries, db.quotes, async () => {
        await db.habits.clear();
        await db.entries.clear();
        await db.quotes.clear();
        
        // Import new data
        await db.habits.bulkAdd(parsedData.data.habits);
        if (parsedData.data.entries) {
          await db.entries.bulkAdd(parsedData.data.entries);
        }
        if (parsedData.data.quotes) {
          await db.quotes.bulkAdd(parsedData.data.quotes);
        }
      });

      toast({
        title: "Welcome back! 🎉",
        description: `Imported ${parsedData.data.habits.length} habits successfully! ✨`,
      });
      
      setImportData('');
      setOpen(false);
      onImported?.();
      
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Import error:', error);
      }
      toast({
        title: "Import failed",
        description: "Invalid backup file. Please check the format! 😔",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Database className="w-4 h-4 mr-2" />
          Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Backup & Restore 💾
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="text-center py-6">
              <Download className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="font-semibold mb-2">Export Your Habits</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Download a backup file to transfer your habits to a new device (completely offline!)
              </p>
              <Button 
                onClick={exportData}
                disabled={isExporting}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {isExporting ? 'Creating backup...' : 'Download Backup'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-accent mb-4" />
                <h3 className="font-semibold mb-2">Restore Your Habits</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import from a backup file (this will replace your current habits!)
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="backup-file" className="text-sm font-medium">
                    Upload backup file
                  </Label>
                  <Input
                    id="backup-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>

                <div className="text-center text-muted-foreground text-sm">or</div>

                <div>
                  <Label htmlFor="backup-text" className="text-sm font-medium">
                    Paste backup data
                  </Label>
                  <Textarea
                    id="backup-text"
                    placeholder="Paste your backup JSON data here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    rows={6}
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <Button
                  onClick={importHabits}
                  disabled={isImporting || !importData.trim()}
                  className="w-full bg-gradient-accent hover:shadow-glow transition-all duration-300"
                >
                  {isImporting ? 'Restoring...' : 'Restore Habits'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};