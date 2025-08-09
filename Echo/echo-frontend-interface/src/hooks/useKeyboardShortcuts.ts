import { useEffect, useCallback } from 'react';
import { ActiveTab } from '@/types';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

interface UseKeyboardShortcutsProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onCreateTask?: () => void;
  onCreateHabit?: () => void;
  onToggleTheme?: () => void;
  currentTab: ActiveTab;
}

export function useKeyboardShortcuts({
  onNavigate,
  onOpenSearch,
  onCreateTask,
  onCreateHabit,
  onToggleTheme,
  currentTab
}: UseKeyboardShortcutsProps) {
  
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: '1',
      ctrlKey: true,
      action: () => onNavigate('main'),
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => onNavigate('tasks'),
      description: 'Go to Tasks',
      category: 'Navigation'
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => onNavigate('habits'),
      description: 'Go to Habits',
      category: 'Navigation'
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => onNavigate('calendar'),
      description: 'Go to Calendar',
      category: 'Navigation'
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => onNavigate('chat'),
      description: 'Go to Chat',
      category: 'Navigation'
    },
    {
      key: '6',
      ctrlKey: true,
      action: () => onNavigate('analytics'),
      description: 'Go to Analytics',
      category: 'Navigation'
    },
    
    // Search shortcuts
    {
      key: 'k',
      ctrlKey: true,
      action: onOpenSearch,
      description: 'Open Global Search',
      category: 'Search'
    },
    {
      key: '/',
      action: onOpenSearch,
      description: 'Open Global Search',
      category: 'Search'
    },
    
    // Creation shortcuts
    {
      key: 'n',
      ctrlKey: true,
      action: () => onCreateTask?.(),
      description: 'Create New Task',
      category: 'Actions'
    },
    {
      key: 'h',
      ctrlKey: true,
      shiftKey: true,
      action: () => onCreateHabit?.(),
      description: 'Create New Habit',
      category: 'Actions'
    },
    
    // Theme toggle
    {
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      action: () => onToggleTheme?.(),
      description: 'Toggle Theme',
      category: 'Interface'
    },
    
    // Quick actions based on current tab
    {
      key: 'r',
      ctrlKey: true,
      action: () => window.location.reload(),
      description: 'Refresh Page',
      category: 'Interface'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow Ctrl+K and / even in inputs for search
      if (!((event.ctrlKey && event.key === 'k') || event.key === '/')) {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch &&
        metaMatch
      ) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Hook to show keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['Ctrl', '1'], description: 'Go to Dashboard' },
      { keys: ['Ctrl', '2'], description: 'Go to Tasks' },
      { keys: ['Ctrl', '3'], description: 'Go to Habits' },
      { keys: ['Ctrl', '4'], description: 'Go to Calendar' },
      { keys: ['Ctrl', '5'], description: 'Go to Chat' },
      { keys: ['Ctrl', '6'], description: 'Go to Analytics' },
    ]},
    { category: 'Search', items: [
      { keys: ['Ctrl', 'K'], description: 'Open Global Search' },
      { keys: ['/'], description: 'Open Global Search' },
    ]},
    { category: 'Actions', items: [
      { keys: ['Ctrl', 'N'], description: 'Create New Task' },
      { keys: ['Ctrl', 'Shift', 'H'], description: 'Create New Habit' },
    ]},
    { category: 'Interface', items: [
      { keys: ['Ctrl', 'Shift', 'T'], description: 'Toggle Theme' },
      { keys: ['Ctrl', 'R'], description: 'Refresh Page' },
      { keys: ['?'], description: 'Show Keyboard Shortcuts' },
    ]},
  ];

  return { shortcuts };
}