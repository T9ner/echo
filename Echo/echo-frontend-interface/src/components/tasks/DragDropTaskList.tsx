import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { SortableTaskItem } from './SortableTaskItem';
import { Task } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GripVertical, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface DragDropTaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  error?: Error | null;
  showDetails?: boolean;
  onTasksReorder?: (tasks: Task[]) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
}

export function DragDropTaskList({
  tasks,
  isLoading,
  error,
  showDetails = false,
  onTasksReorder,
  onTaskUpdate,
  onTaskDelete
}: DragDropTaskListProps) {
  const [isDragMode, setIsDragMode] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Initialize local tasks when tasks prop changes
  useState(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Sort tasks (only when not in drag mode)
  const sortedTasks = useMemo(() => {
    const tasksToUse = isDragMode ? localTasks : tasks;

    // In drag mode, don't sort - preserve manual order
    if (isDragMode) {
      return tasksToUse;
    }

    // Sort tasks (default: newest first, then by priority)
    return [...tasksToUse].sort((a, b) => {
      // First by status (incomplete tasks first)
      if (a.status !== b.status) {
        if (a.status === 'completed') return 1;
        if (b.status === 'completed') return -1;
      }

      // Then by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Finally by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [isDragMode ? localTasks : tasks, isDragMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sortedTasks.findIndex(task => task.id === active.id);
      const newIndex = sortedTasks.findIndex(task => task.id === over?.id);

      const newTasks = arrayMove(sortedTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);
      
      // Notify parent component of reorder
      onTasksReorder?.(newTasks);
    }
  };

  const toggleDragMode = () => {
    if (!isDragMode) {
      // Entering drag mode - sync local tasks with current tasks
      setLocalTasks(sortedTasks);
    }
    setIsDragMode(!isDragMode);
  };

  const saveDragOrder = () => {
    // Save the current order and exit drag mode
    onTasksReorder?.(localTasks);
    setIsDragMode(false);
  };

  const cancelDragMode = () => {
    // Reset to original order and exit drag mode
    setLocalTasks(tasks);
    setIsDragMode(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 border rounded-lg">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load tasks: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-500">
          {Object.keys(filters).length > 0 
            ? "Try adjusting your filters or create a new task."
            : "Get started by creating your first task."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drag Mode Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isDragMode ? "default" : "outline"}
            size="sm"
            onClick={toggleDragMode}
            className="flex items-center gap-2"
          >
            {isDragMode ? (
              <GripVertical className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
            {isDragMode ? "Drag Mode" : "Reorder Tasks"}
          </Button>
          
          {isDragMode && (
            <Badge variant="secondary" className="text-xs">
              Drag tasks to reorder
            </Badge>
          )}
        </div>

        {isDragMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelDragMode}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveDragOrder}
            >
              Save Order
            </Button>
          </div>
        )}
      </div>

      {/* Task List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={sortedTasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                showDetails={showDetails}
                isDragMode={isDragMode}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Drag Mode Help */}
      {isDragMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <GripVertical className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Drag Mode Active</h4>
              <p className="text-sm text-blue-800 mb-2">
                Drag tasks up or down to reorder them. Your custom order will be saved.
              </p>
              <div className="text-xs text-blue-700">
                <p>• Click and drag the grip handle to move tasks</p>
                <p>• Use keyboard navigation with Tab and arrow keys</p>
                <p>• Press Space or Enter to pick up/drop items</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}