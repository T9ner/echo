import { useState, useEffect, useCallback } from 'react';
import { Task, Habit, ChatResponse } from '@/types';
import { toast } from '@/hooks/use-toast';

interface OfflineData {
  tasks: Task[];
  habits: Habit[];
  chatHistory: ChatResponse[];
  lastSync: string;
}

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'habit' | 'chat';
  data: any;
  timestamp: string;
}

const STORAGE_KEYS = {
  OFFLINE_DATA: 'echo-offline-data',
  PENDING_ACTIONS: 'echo-pending-actions',
  LAST_SYNC: 'echo-last-sync'
};

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing data...",
        duration: 3000,
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Working offline. Changes will sync when connection is restored.",
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data and pending actions from localStorage
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
        if (stored) {
          setOfflineData(JSON.parse(stored));
        }

        const storedActions = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
        if (storedActions) {
          setPendingActions(JSON.parse(storedActions));
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadOfflineData();
  }, []);

  // Save offline data to localStorage
  const saveOfflineData = useCallback((data: Partial<OfflineData>) => {
    try {
      const current = offlineData || {
        tasks: [],
        habits: [],
        chatHistory: [],
        lastSync: new Date().toISOString()
      };

      const updated = { ...current, ...data, lastSync: new Date().toISOString() };
      setOfflineData(updated);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, [offlineData]);

  // Add pending action
  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const pendingAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    const updated = [...pendingActions, pendingAction];
    setPendingActions(updated);
    localStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));

    return pendingAction.id;
  }, [pendingActions]);

  // Remove pending action
  const removePendingAction = useCallback((actionId: string) => {
    const updated = pendingActions.filter(action => action.id !== actionId);
    setPendingActions(updated);
    localStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  }, [pendingActions]);

  // Sync pending actions when back online
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || syncInProgress) {
      return;
    }

    setSyncInProgress(true);

    try {
      // Group actions by entity type for efficient syncing
      const taskActions = pendingActions.filter(a => a.entity === 'task');
      const habitActions = pendingActions.filter(a => a.entity === 'habit');
      const chatActions = pendingActions.filter(a => a.entity === 'chat');

      let syncedCount = 0;
      let failedCount = 0;

      // Sync task actions
      for (const action of taskActions) {
        try {
          await syncAction(action);
          removePendingAction(action.id);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync task action:', error);
          failedCount++;
        }
      }

      // Sync habit actions
      for (const action of habitActions) {
        try {
          await syncAction(action);
          removePendingAction(action.id);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync habit action:', error);
          failedCount++;
        }
      }

      // Sync chat actions
      for (const action of chatActions) {
        try {
          await syncAction(action);
          removePendingAction(action.id);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync chat action:', error);
          failedCount++;
        }
      }

      if (syncedCount > 0) {
        toast({
          title: "Sync Complete",
          description: `${syncedCount} action${syncedCount !== 1 ? 's' : ''} synced successfully.`,
          duration: 3000,
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Sync Issues",
          description: `${failedCount} action${failedCount !== 1 ? 's' : ''} failed to sync. Will retry later.`,
          variant: "destructive",
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline changes. Will retry automatically.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, pendingActions, syncInProgress, removePendingAction]);

  // Sync individual action (placeholder - would integrate with actual API)
  const syncAction = async (action: PendingAction) => {
    // This would integrate with your actual API calls
    // For now, just simulate the sync
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation:
    // switch (action.entity) {
    //   case 'task':
    //     if (action.type === 'create') await taskApi.createTask(action.data);
    //     if (action.type === 'update') await taskApi.updateTask(action.data.id, action.data);
    //     if (action.type === 'delete') await taskApi.deleteTask(action.data.id);
    //     break;
    //   // ... similar for habits and chat
    // }
  };

  // Offline-aware data operations
  const offlineCreateTask = useCallback((task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const newTask: Task = {
      ...task,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update offline data
    const currentTasks = offlineData?.tasks || [];
    saveOfflineData({ tasks: [...currentTasks, newTask] });

    // Add to pending actions
    addPendingAction({
      type: 'create',
      entity: 'task',
      data: newTask
    });

    return newTask;
  }, [offlineData, saveOfflineData, addPendingAction]);

  const offlineUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const currentTasks = offlineData?.tasks || [];
    const updatedTasks = currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updated_at: new Date().toISOString() }
        : task
    );

    saveOfflineData({ tasks: updatedTasks });

    addPendingAction({
      type: 'update',
      entity: 'task',
      data: { id: taskId, ...updates }
    });
  }, [offlineData, saveOfflineData, addPendingAction]);

  const offlineDeleteTask = useCallback((taskId: string) => {
    const currentTasks = offlineData?.tasks || [];
    const filteredTasks = currentTasks.filter(task => task.id !== taskId);

    saveOfflineData({ tasks: filteredTasks });

    addPendingAction({
      type: 'delete',
      entity: 'task',
      data: { id: taskId }
    });
  }, [offlineData, saveOfflineData, addPendingAction]);

  // Similar functions for habits would go here...

  // Get offline-aware data
  const getOfflineTasks = useCallback(() => {
    return offlineData?.tasks || [];
  }, [offlineData]);

  const getOfflineHabits = useCallback(() => {
    return offlineData?.habits || [];
  }, [offlineData]);

  const getOfflineChatHistory = useCallback(() => {
    return offlineData?.chatHistory || [];
  }, [offlineData]);

  // Clear offline data (useful for logout or reset)
  const clearOfflineData = useCallback(() => {
    setOfflineData(null);
    setPendingActions([]);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_DATA);
    localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIONS);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }, []);

  return {
    isOnline,
    offlineData,
    pendingActions: pendingActions.length,
    syncInProgress,
    
    // Data operations
    saveOfflineData,
    getOfflineTasks,
    getOfflineHabits,
    getOfflineChatHistory,
    
    // Task operations
    offlineCreateTask,
    offlineUpdateTask,
    offlineDeleteTask,
    
    // Sync operations
    syncPendingActions,
    clearOfflineData,
    
    // Status
    hasPendingChanges: pendingActions.length > 0,
    lastSync: offlineData?.lastSync
  };
}