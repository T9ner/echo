/**
 * Virtual Scrolling Component for Large Lists
 * 
 * This component renders only visible items in large lists to improve performance.
 * Perfect for task lists with hundreds or thousands of items.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Number of items to render outside visible area
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    // Add overscan
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  if (loading && loadingComponent) {
    return <div className={cn("flex items-center justify-center", className)}>{loadingComponent}</div>;
  }

  if (items.length === 0 && emptyComponent) {
    return <div className={cn("flex items-center justify-center", className)}>{emptyComponent}</div>;
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for managing virtual scroll state
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    visibleItems,
    totalHeight,
    offsetY,
  };
}

// Example usage component
export function VirtualTaskList({ tasks }: { tasks: any[] }) {
  const renderTask = (task: any, index: number) => (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h3 className="font-medium">{task.title}</h3>
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </div>
      <div className="text-sm text-muted-foreground">
        {task.status}
      </div>
    </div>
  );

  const loadingComponent = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">Loading tasks...</span>
    </div>
  );

  const emptyComponent = (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <div className="text-center">
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm">Create your first task to get started</p>
      </div>
    </div>
  );

  return (
    <VirtualScrollList
      items={tasks}
      itemHeight={80} // Height of each task item
      containerHeight={600} // Height of the scrollable container
      renderItem={renderTask}
      className="border rounded-lg"
      overscan={3}
      loadingComponent={loadingComponent}
      emptyComponent={emptyComponent}
    />
  );
}

// Performance monitoring hook
export function useVirtualScrollPerformance() {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Performance metrics tracked for optimization
  });

  return {
    renderCount: renderCount.current,
  };
}