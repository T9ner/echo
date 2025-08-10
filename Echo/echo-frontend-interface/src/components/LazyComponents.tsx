/**
 * Lazy-loaded components for code splitting and performance optimization
 *
 * This file defines lazy-loaded versions of major components to improve
 * initial bundle size and loading performance.
 */
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Loading...</span>
  </div>
);

// Lazy load major components (handling named exports)
export const LazyMainDashboard = lazy(() =>
  import("./MainDashboard").then((module) => ({
    default: module.MainDashboard,
  }))
);
export const LazyChatView = lazy(() =>
  import("./ChatView").then((module) => ({ default: module.ChatView }))
);
export const LazyAnalyticsCharts = lazy(() =>
  import("./analytics/AnalyticsCharts").then((module) => ({
    default: module.AnalyticsCharts,
  }))
);
export const LazyProductivityMetrics = lazy(() =>
  import("./analytics/ProductivityMetrics").then((module) => ({
    default: module.ProductivityMetrics,
  }))
);

// HOC for wrapping lazy components with Suspense
export const withSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withSuspense(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};

// Pre-wrapped components ready to use
export const SuspendedMainDashboard = withSuspense(LazyMainDashboard);
export const SuspendedChatView = withSuspense(LazyChatView);
export const SuspendedAnalyticsCharts = withSuspense(LazyAnalyticsCharts);
export const SuspendedProductivityMetrics = withSuspense(
  LazyProductivityMetrics
);

// Custom loading states for specific components
export const ChatLoadingState = () => (
  <div className="flex items-center justify-center min-h-[300px] bg-background/50 rounded-lg border border-dashed">
    <div className="text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading chat interface...</p>
    </div>
  </div>
);

export const AnalyticsLoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px] bg-background/50 rounded-lg border border-dashed">
    <div className="text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading analytics...</p>
      <p className="text-xs text-muted-foreground mt-1">
        Calculating productivity insights
      </p>
    </div>
  </div>
);

// Lazy components with custom loading states
export const SuspendedChatViewWithCustomLoading = withSuspense(
  LazyChatView,
  <ChatLoadingState />
);
export const SuspendedAnalyticsWithCustomLoading = withSuspense(
  LazyAnalyticsCharts,
  <AnalyticsLoadingState />
);

// Preload functions for better UX
export const preloadComponents = {
  dashboard: () =>
    import("./MainDashboard").then((module) => ({
      default: module.MainDashboard,
    })),
  chat: () =>
    import("./ChatView").then((module) => ({ default: module.ChatView })),
  analytics: () =>
    import("./analytics/AnalyticsCharts").then((module) => ({
      default: module.AnalyticsCharts,
    })),
  metrics: () =>
    import("./analytics/ProductivityMetrics").then((module) => ({
      default: module.ProductivityMetrics,
    })),
};

// Utility to preload components on user interaction
export const preloadOnHover = (
  componentKey: keyof typeof preloadComponents
) => ({
  onMouseEnter: () => preloadComponents[componentKey](),
  onFocus: () => preloadComponents[componentKey](),
});

// Example usage:
/*
// In your router or main component:
import { SuspendedMainDashboard, SuspendedChatView, preloadOnHover } from './LazyComponents';

// Use in routes
<Route path="/dashboard" element={<SuspendedMainDashboard />} />
<Route path="/chat" element={<SuspendedChatView />} />

// Preload on navigation hover
<Link to="/chat" {...preloadOnHover('chat')}>
  Chat
</Link>
*/
