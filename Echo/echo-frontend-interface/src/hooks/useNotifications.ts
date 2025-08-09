import { useEffect, useState, useCallback } from "react";
import { Task, Habit } from "@/types";
import {
  isToday,
  isTomorrow,
  isPast,
  differenceInHours,
  format,
} from "date-fns";
import { toast } from "@/hooks/use-toast";

interface NotificationSettings {
  enabled: boolean;
  dueDateReminders: boolean;
  habitReminders: boolean;
  overdueAlerts: boolean;
  soundEnabled: boolean;
  reminderHours: number; // Hours before due date to remind
}

interface Notification {
  id: string;
  type: "due_soon" | "overdue" | "habit_reminder" | "achievement";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  timestamp: Date;
  data?: any;
  dismissed?: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dueDateReminders: true,
  habitReminders: true,
  overdueAlerts: true,
  soundEnabled: false,
  reminderHours: 2,
};

export function useNotifications(tasks: Task[] = [], habits: Habit[] = []) {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("echo-notification-settings");
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    }
    return false;
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "echo-notification-settings",
      JSON.stringify(settings)
    );
  }, [settings]);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Generate notifications based on tasks and habits
  const generateNotifications = useCallback(() => {
    if (!settings.enabled) return [];

    const newNotifications: Notification[] = [];
    const now = new Date();

    // Task due date notifications
    if (settings.dueDateReminders) {
      tasks.forEach((task) => {
        if (task.status === "completed" || !task.due_date) return;

        const dueDate = new Date(task.due_date);
        const hoursUntilDue = differenceInHours(dueDate, now);

        // Overdue tasks
        if (settings.overdueAlerts && isPast(dueDate) && !isToday(dueDate)) {
          newNotifications.push({
            id: `overdue-${task.id}`,
            type: "overdue",
            title: "Overdue Task",
            message: `"${task.title}" was due ${format(dueDate, "MMM d")}`,
            priority: "high",
            timestamp: now,
            data: { task, type: "overdue" },
          });
        }
        // Due today
        else if (isToday(dueDate)) {
          newNotifications.push({
            id: `due-today-${task.id}`,
            type: "due_soon",
            title: "Due Today",
            message: `"${task.title}" is due today`,
            priority: "medium",
            timestamp: now,
            data: { task, type: "due_today" },
          });
        }
        // Due tomorrow
        else if (isTomorrow(dueDate)) {
          newNotifications.push({
            id: `due-tomorrow-${task.id}`,
            type: "due_soon",
            title: "Due Tomorrow",
            message: `"${task.title}" is due tomorrow`,
            priority: "low",
            timestamp: now,
            data: { task, type: "due_tomorrow" },
          });
        }
        // Due within reminder hours
        else if (hoursUntilDue > 0 && hoursUntilDue <= settings.reminderHours) {
          newNotifications.push({
            id: `due-soon-${task.id}`,
            type: "due_soon",
            title: "Task Due Soon",
            message: `"${task.title}" is due in ${Math.ceil(
              hoursUntilDue
            )} hour${Math.ceil(hoursUntilDue) !== 1 ? "s" : ""}`,
            priority: "medium",
            timestamp: now,
            data: { task, type: "due_soon" },
          });
        }
      });
    }

    // Habit reminder notifications
    if (settings.habitReminders) {
      habits.forEach((habit) => {
        // Simple daily habit reminder (can be enhanced with more complex logic)
        if (habit.frequency === "daily") {
          const lastCompleted = habit.last_completed
            ? new Date(habit.last_completed)
            : null;
          const shouldRemind = !lastCompleted || !isToday(lastCompleted);

          if (shouldRemind) {
            newNotifications.push({
              id: `habit-reminder-${habit.id}`,
              type: "habit_reminder",
              title: "Habit Reminder",
              message: `Don't forget to complete "${habit.name}" today`,
              priority: "low",
              timestamp: now,
              data: { habit, type: "habit_reminder" },
            });
          }
        }
      });
    }

    return newNotifications;
  }, [tasks, habits, settings]);

  // Update notifications
  useEffect(() => {
    const newNotifications = generateNotifications();
    setNotifications((prev) => {
      // Merge with existing notifications, avoiding duplicates
      const existingIds = new Set(prev.map((n) => n.id));
      const uniqueNew = newNotifications.filter((n) => !existingIds.has(n.id));
      return [...prev.filter((n) => !n.dismissed), ...uniqueNew];
    });
  }, [generateNotifications]);

  // Show browser notifications
  const showBrowserNotification = useCallback(
    (notification: Notification) => {
      if (permission !== "granted" || !settings.enabled) return;

      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
        requireInteraction: notification.priority === "high",
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        // Could navigate to relevant section here
      };

      // Auto-close after 5 seconds for low priority
      if (notification.priority === "low") {
        setTimeout(() => browserNotification.close(), 5000);
      }
    },
    [permission, settings.enabled]
  );

  // Show toast notifications
  const showToastNotification = useCallback(
    (notification: Notification) => {
      if (!settings.enabled) return;

      const variant =
        notification.priority === "high" ? "destructive" : "default";

      toast({
        title: notification.title,
        description: notification.message,
        variant,
        duration: notification.priority === "high" ? 10000 : 5000,
      });
    },
    [settings.enabled]
  );

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  // Get active (non-dismissed) notifications
  const activeNotifications = notifications.filter((n) => !n.dismissed);

  // Trigger notifications when new ones are added
  useEffect(() => {
    const recentNotifications = notifications.filter(
      (n) => !n.dismissed && Date.now() - n.timestamp.getTime() < 1000 // Within last second
    );

    recentNotifications.forEach((notification) => {
      showToastNotification(notification);
      if (settings.soundEnabled) {
        showBrowserNotification(notification);
      }
    });
  }, [
    notifications,
    showToastNotification,
    showBrowserNotification,
    settings.soundEnabled,
  ]);

  return {
    notifications: activeNotifications,
    settings,
    permission,
    requestPermission,
    updateSettings,
    dismissNotification,
    clearAllNotifications,
    showToastNotification,
    showBrowserNotification,
  };
}
