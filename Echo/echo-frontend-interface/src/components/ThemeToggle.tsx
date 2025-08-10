import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative w-10 h-10 rounded-xl hover:bg-accent/50 transition-smooth focus-ring group"
        >
          {/* Icon with smooth transitions */}
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-smooth dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-smooth dark:rotate-0 dark:scale-100" />
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-smooth"></div>
          
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="glass border-border/50 shadow-lg animate-slide-down"
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="cursor-pointer transition-smooth hover:bg-accent/50 focus:bg-accent/50"
        >
          <Sun className="mr-3 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary"></div>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="cursor-pointer transition-smooth hover:bg-accent/50 focus:bg-accent/50"
        >
          <Moon className="mr-3 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary"></div>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="cursor-pointer transition-smooth hover:bg-accent/50 focus:bg-accent/50"
        >
          <Monitor className="mr-3 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary"></div>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}