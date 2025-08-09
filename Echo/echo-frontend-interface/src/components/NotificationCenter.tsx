import { useState } from 'react';
import { Bell, X, Clock, AlertTriangle, Target, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useNotifications } from '@/hooks/useNotifications';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  onNavigate?: (tab: string, id?: string) => void;
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  
  const {
    notifications,
    settings,
    permission,
    requestPermission,
    updateSettings,
    dismissNotification,
    clearAllNotifications
  } = useNotifications(tasks, habits);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'due_soon':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'habit_reminder':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.data?.task) {
      onNavigate?.('tasks', notification.data.task.id);
    } else if (notification.data?.habit) {
      onNavigate?.('habits', notification.data.habit.id);
    }
    dismissNotification(notification.id);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      updateSettings({ soundEnabled: true });
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notifications.length > 9 ? '9+' : notifications.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="font-medium mb-1">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors",
                      getPriorityColor(notification.priority)
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {permission === 'default' && (
            <div className="p-4 border-t bg-blue-50">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Enable Browser Notifications
                  </p>
                  <p className="text-xs text-blue-700">
                    Get notified even when ECHO is not active
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleRequestPermission}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Enable
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Notification Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable Notifications</Label>
                <p className="text-xs text-gray-500">Turn all notifications on/off</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(enabled) => updateSettings({ enabled })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Due Date Reminders</Label>
                  <p className="text-xs text-gray-500">Get notified about upcoming tasks</p>
                </div>
                <Switch
                  checked={settings.dueDateReminders}
                  onCheckedChange={(dueDateReminders) => updateSettings({ dueDateReminders })}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Habit Reminders</Label>
                  <p className="text-xs text-gray-500">Daily habit completion reminders</p>
                </div>
                <Switch
                  checked={settings.habitReminders}
                  onCheckedChange={(habitReminders) => updateSettings({ habitReminders })}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Overdue Alerts</Label>
                  <p className="text-xs text-gray-500">Alert for overdue tasks</p>
                </div>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(overdueAlerts) => updateSettings({ overdueAlerts })}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Browser Notifications</Label>
                  <p className="text-xs text-gray-500">Show system notifications</p>
                </div>
                <Switch
                  checked={settings.soundEnabled && permission === 'granted'}
                  onCheckedChange={(soundEnabled) => {
                    if (soundEnabled && permission !== 'granted') {
                      handleRequestPermission();
                    } else {
                      updateSettings({ soundEnabled });
                    }
                  }}
                  disabled={!settings.enabled}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Reminder Timing
              </Label>
              <p className="text-xs text-gray-500">
                How many hours before due date to remind you
              </p>
              <div className="px-2">
                <Slider
                  value={[settings.reminderHours]}
                  onValueChange={([reminderHours]) => updateSettings({ reminderHours })}
                  max={24}
                  min={1}
                  step={1}
                  disabled={!settings.enabled || !settings.dueDateReminders}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 hour</span>
                  <span className="font-medium">{settings.reminderHours} hours</span>
                  <span>24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}