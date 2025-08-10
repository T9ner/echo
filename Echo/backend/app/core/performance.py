"""
Performance monitoring and optimization utilities
"""
import time
import logging
from functools import wraps
from typing import Callable, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)


def performance_monitor(log_slow_queries: bool = True, slow_threshold: float = 1.0):
    """
    Decorator to monitor function performance
    
    Args:
        log_slow_queries: Whether to log slow operations
        slow_threshold: Threshold in seconds to consider operation slow
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                if log_slow_queries and execution_time > slow_threshold:
                    logger.warning(
                        f"Slow operation detected: {func.__name__} took {execution_time:.2f}s"
                    )
                elif execution_time > 0.1:  # Log operations over 100ms
                    logger.info(
                        f"Operation timing: {func.__name__} took {execution_time:.3f}s"
                    )
                
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(
                    f"Operation failed: {func.__name__} failed after {execution_time:.3f}s - {str(e)}"
                )
                raise
        
        return wrapper
    return decorator


@contextmanager
def performance_timer(operation_name: str):
    """
    Context manager for timing operations
    
    Example:
        with performance_timer("database_query"):
            result = db.query(Model).all()
    """
    start_time = time.time()
    try:
        yield
    finally:
        execution_time = time.time() - start_time
        logger.info(f"Performance: {operation_name} took {execution_time:.3f}s")


class QueryOptimizer:
    """
    Utilities for optimizing database queries
    """
    
    @staticmethod
    def batch_size_calculator(total_items: int, max_batch_size: int = 1000) -> int:
        """
        Calculate optimal batch size for processing large datasets
        
        Args:
            total_items: Total number of items to process
            max_batch_size: Maximum batch size
            
        Returns:
            Optimal batch size
        """
        if total_items <= 100:
            return total_items
        elif total_items <= 1000:
            return min(100, total_items)
        else:
            return min(max_batch_size, max(100, total_items // 10))
    
    @staticmethod
    def should_use_pagination(count: int, threshold: int = 100) -> bool:
        """
        Determine if pagination should be used based on result count
        
        Args:
            count: Number of results
            threshold: Threshold for using pagination
            
        Returns:
            True if pagination should be used
        """
        return count > threshold


class PerformanceMetrics:
    """
    Collect and track performance metrics
    """
    
    def __init__(self):
        self.metrics = {
            'api_calls': 0,
            'database_queries': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'slow_operations': 0
        }
    
    def increment(self, metric: str, value: int = 1):
        """Increment a metric counter"""
        if metric in self.metrics:
            self.metrics[metric] += value
    
    def get_metrics(self) -> dict:
        """Get current metrics"""
        return self.metrics.copy()
    
    def reset(self):
        """Reset all metrics"""
        for key in self.metrics:
            self.metrics[key] = 0


# Global performance metrics instance
performance_metrics = PerformanceMetrics()


def track_api_call(func: Callable) -> Callable:
    """Decorator to track API call metrics"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        performance_metrics.increment('api_calls')
        return func(*args, **kwargs)
    return wrapper


def track_database_query(func: Callable) -> Callable:
    """Decorator to track database query metrics"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        performance_metrics.increment('database_queries')
        return func(*args, **kwargs)
    return wrapper


# Example usage:
"""
from app.core.performance import performance_monitor, performance_timer, track_api_call

@performance_monitor(slow_threshold=0.5)
@track_api_call
def get_tasks_endpoint():
    with performance_timer("fetch_tasks"):
        return task_service.get_all_tasks()
"""