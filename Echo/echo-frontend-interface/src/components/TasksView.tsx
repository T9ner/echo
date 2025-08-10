import { useState } from 'react';
import { Plus, RefreshCw, ArrowUpDown, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskForm } from './tasks/TaskForm';
import { TaskList } from './tasks/TaskList';
import { DragDropTaskList } from './tasks/DragDropTaskList';
import { useTasks } from '@/hooks/useTasks';
import { useApiHealth } from '@/hooks/useApiHealth';

export function TasksView() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [useDragDrop, setUseDragDrop] = useState(false);

  // Fetch all tasks without filters
  const { data: tasks = [], isLoading, error, refetch } = useTasks();
  
  // Check API health
  const { data: healthStatus, isError: healthError } = useApiHealth();

  // Calculate task count for display
  const totalTasks = tasks.length;

  const handleRefresh = () => {
    refetch();
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    // Tasks will automatically refresh due to React Query cache invalidation
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage your tasks and track progress</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseDragDrop(!useDragDrop)}
              title={useDragDrop ? "Switch to List View" : "Switch to Drag & Drop View"}
            >
              {useDragDrop ? (
                <List className="h-4 w-4 mr-2" />
              ) : (
                <ArrowUpDown className="h-4 w-4 mr-2" />
              )}
              {useDragDrop ? "List View" : "Drag & Drop"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <TaskForm
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              }
              isOpen={showTaskForm}
              onOpenChange={setShowTaskForm}
              onSuccess={handleTaskCreated}
            />
          </div>
        </div>

        {/* API Health Warning */}
        {healthError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Unable to connect to the backend API. Some features may not work properly.
            </AlertDescription>
          </Alert>
        )}

        {/* Task count display */}
        <div className="text-sm text-gray-600">
          Showing {totalTasks} tasks
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-6">
        {useDragDrop ? (
          <DragDropTaskList
            tasks={tasks}
            isLoading={isLoading}
            error={error}
            showDetails={false}
            onTasksReorder={(reorderedTasks) => {
              // Handle task reordering - could save to backend
              console.log('Tasks reordered:', reorderedTasks);
            }}
          />
        ) : (
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            error={error}
            showDetails={false}
          />
        )}
      </div>
    </div>
  );
}