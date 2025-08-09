import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HabitCreate, HabitFrequency, Habit } from '@/types';
import { useCreateHabit, useUpdateHabit } from '@/hooks/useHabits';

const habitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  frequency: z.nativeEnum(HabitFrequency),
  target_count: z.number().min(1, 'Target count must be at least 1').max(10, 'Target count cannot exceed 10'),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface HabitFormProps {
  habit?: Habit; // If provided, we're editing
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HabitForm({ habit, onSuccess, trigger, isOpen, onOpenChange }: HabitFormProps) {
  const isEditing = !!habit;
  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: habit?.name || '',
      description: habit?.description || '',
      frequency: habit?.frequency || HabitFrequency.DAILY,
      target_count: habit?.target_count || 1,
    },
  });

  const onSubmit = async (data: HabitFormData) => {
    if (isEditing) {
      updateHabitMutation.mutate({
        habitId: habit.id,
        habit: data
      }, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    } else {
      const habitData: HabitCreate = {
        name: data.name,
        description: data.description || undefined,
        frequency: data.frequency,
        target_count: data.target_count,
      };

      createHabitMutation.mutate(habitData, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    }
  };

  const mutation = isEditing ? updateHabitMutation : createHabitMutation;

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Habit Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Drink 8 glasses of water"
          {...form.register('name')}
          className={form.formState.errors.name ? 'border-red-500' : ''}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description or notes about this habit"
          rows={3}
          {...form.register('description')}
          className={form.formState.errors.description ? 'border-red-500' : ''}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select
          value={form.watch('frequency')}
          onValueChange={(value: HabitFrequency) => form.setValue('frequency', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={HabitFrequency.DAILY}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                Daily - Every day
              </div>
            </SelectItem>
            <SelectItem value={HabitFrequency.WEEKLY}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Weekly - Once per week
              </div>
            </SelectItem>
            <SelectItem value={HabitFrequency.CUSTOM}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                Custom - Flexible schedule
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Target Count */}
      <div className="space-y-2">
        <Label htmlFor="target_count">
          Target Count per {form.watch('frequency')?.toLowerCase() || 'period'}
        </Label>
        <Select
          value={form.watch('target_count')?.toString()}
          onValueChange={(value) => form.setValue('target_count', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select target count" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {count} time{count > 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.target_count && (
          <p className="text-sm text-red-500">{form.formState.errors.target_count.message}</p>
        )}
      </div>

      {/* Frequency Explanation */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
        <strong>Frequency Guide:</strong>
        <ul className="mt-1 space-y-1">
          <li><strong>Daily:</strong> Track completion every day</li>
          <li><strong>Weekly:</strong> Track completion once per week</li>
          <li><strong>Custom:</strong> Flexible tracking for irregular habits</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange?.(false)}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending || !form.formState.isValid}
        >
          {mutation.isPending 
            ? (isEditing ? 'Updating...' : 'Creating...') 
            : (isEditing ? 'Update Habit' : 'Create Habit')
          }
        </Button>
      </div>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Habit' : 'Create New Habit'}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Habit' : 'Create New Habit'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}