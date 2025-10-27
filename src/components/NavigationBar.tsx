import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, BarChart3, Trophy, Target, Settings, Calendar } from 'lucide-react';

export const NavigationBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
    { path: '/challenges', icon: Target, label: 'Challenges' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link key={path} to={path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
