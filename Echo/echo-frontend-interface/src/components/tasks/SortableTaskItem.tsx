import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

interface SortableTaskItemProps {
  task: Task;
  showDetails?: boolean;
  isDragMode?: boolean;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export function SortableTaskItem({
  task,
  showDetails = false,
  isDragMode = false,
  onUpdate,
  onDelete
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 shadow-lg",
        isDragMode && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        {isDragMode && (
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Task Item */}
        <div className="flex-1">
          <TaskItem
            task={task}
            showDetails={showDetails}
            onUpdate={onUpdate}
            onDelete={onDelete}
            className={cn(
              isDragMode && "border-dashed",
              isDragging && "opacity-50"
            )}
          />
        </div>
      </div>
    </div>
  );
}