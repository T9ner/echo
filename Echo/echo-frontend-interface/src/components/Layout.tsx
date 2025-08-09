import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { EchoSidebar } from '@/components/EchoSidebar';
import { MainDashboard } from '@/components/MainDashboard';
import { TasksView } from '@/components/TasksView';
import { HabitsView } from '@/components/HabitsView';
import { CalendarView } from '@/components/CalendarView';
import { ChatView } from '@/components/ChatView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ActiveTab } from '@/types';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Advanced features state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

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
    onOpenSearch: () => setShowGlobalSearch(true),
    onCreateTask: () => {
      // Navigate to tasks and trigger create
      handleTabChange('tasks');
      // Could dispatch a custom event or use a global state
    },
    onCreateHabit: () => {
      // Navigate to habits and trigger create
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
        return <MainDashboard />;
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
        return <MainDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        {/* Sticky Sidebar */}
        <div className="sticky top-0 h-screen flex-shrink-0">
          <EchoSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          {/* Header Bar - Clean and minimal */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* Notification Center */}
              <NotificationCenter onNavigate={handleNavigateWithId} />
              
              {/* Keyboard Shortcuts Help */}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors"
                title="Keyboard Shortcuts (Press ?)"
              >
                ?
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto animate-fade-in">
            {renderActiveView()}
          </div>
        </SidebarInset>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={handleNavigateWithId}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* CSS for highlight animation */}
      <style>{`
        .highlight-item {
          animation: highlight 2s ease-in-out;
        }
        .animate-fade-in { animation: fadeIn 0.25s ease-in; }
        
        @keyframes highlight {
          0% { background-color: transparent; }
          50% { background-color: rgba(59, 130, 246, 0.1); }
          100% { background-color: transparent; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </SidebarProvider>
  );
}