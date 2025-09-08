import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { EchoSidebar } from '@/components/EchoSidebar';
import { MainDashboard } from '@/components/MainDashboard';
import { TasksView } from '@/components/TasksView';
import { HabitsView } from '@/components/HabitsView';
import CalendarView from '@/pages/CalendarView';
import { ChatView } from '@/components/ChatView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ActiveTab } from '@/types';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // UI state
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Note: Offline support removed for cleaner UI

  // Determine active tab from current route
  const getActiveTabFromPath = (pathname: string): ActiveTab => {
    if (pathname.startsWith('/tasks')) return 'tasks';
    if (pathname.startsWith('/habits')) return 'habits';
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/chat')) return 'chat';
    if (pathname.startsWith('/analytics')) return 'analytics';
    return 'main';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleTabChange = (tab: ActiveTab) => {
    const routes = {
      main: '/',
      tasks: '/tasks',
      habits: '/habits',
      calendar: '/calendar',
      chat: '/chat',
      analytics: '/analytics'
    };
    navigate(routes[tab]);
  };

  const handleNavigateWithId = (tab: ActiveTab, id?: string) => {
    handleTabChange(tab);
    // Could scroll to specific item or highlight it
    if (id) {
      // Implementation for navigating to specific items
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-item');
          setTimeout(() => element.classList.remove('highlight-item'), 2000);
        }
      }, 100);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNavigate: handleTabChange,
    onCreateTask: () => {
      handleTabChange('tasks');
    },
    onCreateHabit: () => {
      handleTabChange('habits');
    },
    currentTab: activeTab
  });

  // Handle keyboard shortcut for help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowKeyboardHelp(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'main':
        return <MainDashboard onNavigate={handleTabChange} />;
      case 'tasks':
        return <TasksView />;
      case 'habits':
        return <HabitsView />;
      case 'calendar':
        return <CalendarView />;
      case 'chat':
        return <ChatView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <MainDashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        {/* Fixed Sidebar */}
        <div className={`fixed left-0 top-0 h-screen flex-shrink-0 z-30 transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <EchoSidebar activeTab={activeTab} onTabChange={(tab) => {
            handleTabChange(tab);
            setIsMobileSidebarOpen(false); // Close mobile sidebar on navigation
          }} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content Area with left margin for sidebar */}
        <div className="flex flex-col flex-1 min-w-0 lg:ml-64">
          {/* Clean Header Bar */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/50 px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-smooth focus-ring lg:hidden"
              title="Toggle Menu"
            >
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-3">
              {/* Notification Center */}
              <NotificationCenter onNavigate={handleNavigateWithId} />
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Keyboard Shortcuts Help */}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-smooth focus-ring"
                title="Keyboard Shortcuts (Press ?)"
              >
                <span className="text-sm font-medium">?</span>
              </button>
            </div>
          </header>

          {/* Enhanced Main Content - Only this area scrolls */}
          <div className="flex-1 overflow-y-auto">
            <div className="animate-fade-in h-full">
              {renderActiveView()}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Enhanced CSS for animations */}
      <style>{`
        .highlight-item {
          animation: highlight 2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        @keyframes highlight {
          0% { 
            background-color: transparent; 
            transform: scale(1);
          }
          50% { 
            background-color: hsl(var(--primary) / 0.1); 
            transform: scale(1.02);
          }
          100% { 
            background-color: transparent; 
            transform: scale(1);
          }
        }

        /* Smooth page transitions */
        .page-transition-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .page-transition-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1), 
                      transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        .page-transition-exit {
          opacity: 1;
          transform: translateY(0);
        }
        
        .page-transition-exit-active {
          opacity: 0;
          transform: translateY(-20px);
          transition: opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1), 
                      transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
      `}</style>
    </SidebarProvider>
  );
}