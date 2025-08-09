import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, CheckCircle, Target, MessageSquare, BarChart3, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useChatHistory } from '@/hooks/useChat';
import { Task, Habit, ChatResponse, ActiveTab } from '@/types';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, id?: string) => void;
}

interface SearchResult {
  id: string;
  type: 'task' | 'habit' | 'chat' | 'analytics';
  title: string;
  description?: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  data: any;
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data for search
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: chatHistory = [] } = useChatHistory();

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const searchLower = query.toLowerCase();

    // Search tasks
    tasks.forEach((task: Task) => {
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
      
      if (titleMatch || descriptionMatch) {
        let badge = '';
        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
        
        if (task.status === 'completed') {
          badge = 'Completed';
          badgeVariant = 'secondary';
        } else if (task.due_date) {
          const dueDate = new Date(task.due_date);
          if (isPast(dueDate) && !isToday(dueDate)) {
            badge = 'Overdue';
            badgeVariant = 'destructive';
          } else if (isToday(dueDate)) {
            badge = 'Due Today';
            badgeVariant = 'default';
          } else if (isTomorrow(dueDate)) {
            badge = 'Due Tomorrow';
            badgeVariant = 'outline';
          }
        }

        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          subtitle: task.due_date ? `Due ${format(new Date(task.due_date), 'MMM d, yyyy')}` : undefined,
          icon: task.status === 'completed' ? 
            <CheckCircle className="h-4 w-4 text-green-500" /> : 
            <Clock className="h-4 w-4 text-blue-500" />,
          badge,
          badgeVariant,
          data: task
        });
      }
    });

    // Search habits
    habits.forEach((habit: Habit) => {
      const titleMatch = habit.name.toLowerCase().includes(searchLower);
      const descriptionMatch = habit.description?.toLowerCase().includes(searchLower);
      
      if (titleMatch || descriptionMatch) {
        results.push({
          id: habit.id,
          type: 'habit',
          title: habit.name,
          description: habit.description,
          subtitle: `${habit.frequency} • ${habit.current_streak || 0} day streak`,
          icon: <Target className="h-4 w-4 text-purple-500" />,
          badge: habit.frequency,
          badgeVariant: 'outline',
          data: habit
        });
      }
    });

    // Search chat history
    chatHistory.forEach((chat: ChatResponse, index: number) => {
      const messageMatch = chat.user_message?.toLowerCase().includes(searchLower);
      const responseMatch = chat.ai_response?.toLowerCase().includes(searchLower);
      
      if (messageMatch || responseMatch) {
        results.push({
          id: `chat-${index}`,
          type: 'chat',
          title: chat.user_message || 'Chat Message',
          description: chat.ai_response?.substring(0, 100) + '...',
          subtitle: chat.timestamp ? format(new Date(chat.timestamp), 'MMM d, HH:mm') : undefined,
          icon: <MessageSquare className="h-4 w-4 text-green-500" />,
          data: chat
        });
      }
    });

    // Add analytics shortcuts if query matches
    if ('analytics'.includes(searchLower) || 'dashboard'.includes(searchLower) || 'insights'.includes(searchLower)) {
      results.push({
        id: 'analytics',
        type: 'analytics',
        title: 'Analytics Dashboard',
        description: 'View productivity metrics and insights',
        icon: <BarChart3 className="h-4 w-4 text-orange-500" />,
        data: null
      });
    }

    return results.slice(0, 10); // Limit to 10 results
  }, [query, tasks, habits, chatHistory]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleResultSelect(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleResultSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        onNavigate('tasks', result.id);
        break;
      case 'habit':
        onNavigate('habits', result.id);
        break;
      case 'chat':
        onNavigate('chat');
        break;
      case 'analytics':
        onNavigate('analytics');
        break;
    }
    onClose();
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Task';
      case 'habit': return 'Habit';
      case 'chat': return 'Chat';
      case 'analytics': return 'Analytics';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Everything
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, habits, chat history..."
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Search ECHO</p>
              <p className="text-sm">
                Find tasks, habits, chat history, and more
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Use ↑↓ to navigate • Enter to select • Esc to close</p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
              <p className="font-medium mb-1">No results found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors",
                    index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="flex-shrink-0">
                    {result.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      {result.badge && (
                        <Badge variant={result.badgeVariant} className="text-xs">
                          {result.badge}
                        </Badge>
                      )}
                    </div>
                    
                    {result.description && (
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {result.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        {getResultTypeLabel(result.type)}
                      </span>
                      {result.subtitle && (
                        <>
                          <span>•</span>
                          <span>{result.subtitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              <span>↑↓ Navigate • Enter Select • Esc Close</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}