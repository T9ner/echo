import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Circle, 
  CheckCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  Calendar,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Task, TaskStatus, TaskPriority, TaskUpdate } from '@/types';
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

interface TaskItemProps {
  task: Task;
  showDetails?: boolean;
}

export function TaskItem({ task, showDetails = false }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<TaskUpdate>({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    due_date: task.due_date || '',
  });

  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case TaskStatus.TODO:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800 border-red-200';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== TaskStatus.COMPLETED;
  const isDueSoon = task.due_date && new Date(task.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && task.status !== TaskStatus.COMPLETED;

  const handleStatusToggle = () => {
    let newStatus: TaskStatus;
    if (task.status === TaskStatus.TODO) {
      newStatus = TaskStatus.IN_PROGRESS;
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      newStatus = TaskStatus.COMPLETED;
    } else {
      newStatus = TaskStatus.TODO;
    }

    updateTaskMutation.mutate({
      taskId: task.id,
      task: { status: newStatus }
    });
  };

  const handleSaveEdit = () => {
    updateTaskMutation.mutate({
      taskId: task.id,
      task: editedTask
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditedTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  if (isEditing) {
    return (
      <Card className="border-blue-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <Input
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            placeholder="Task title"
            className="font-medium"
          />
          
          <Textarea
            value={editedTask.description}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            placeholder="Task description"
            rows={2}
          />

          <div className="flex gap-2">
            <Select
              value={editedTask.priority}
              onValueChange={(value: TaskPriority) => setEditedTask({ ...editedTask, priority: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveEdit}
              disabled={!editedTask.title.trim() || updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      task.status === TaskStatus.COMPLETED ? 'opacity-75' : ''
    } ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={handleStatusToggle}
            disabled={updateTaskMutation.isPending}
          >
            {getStatusIcon(task.status)}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-medium text-sm leading-tight ${
                task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Description */}
            {task.description && (showDetails || task.description.length < 100) && (
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Task Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority Badge */}
              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>

              {/* Status Badge */}
              <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </Badge>

              {/* Due Date */}
              {task.due_date && (
                <div className={`flex items-center gap-1 text-xs ${
                  isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Completion Date */}
            {task.completed_at && (
              <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                <CheckCircle className="h-3 w-3" />
                <span>Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}