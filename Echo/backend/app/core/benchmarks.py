"""
Performance benchmarking utilities for ECHO AI Assistant

This module provides tools to measure and analyze the performance of various
components in the application, helping identify bottlenecks and optimization opportunities.
"""
import time
import statistics
import logging
from typing import Dict, List, Any, Callable, Optional
from contextlib import contextmanager
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from functools import wraps

logger = logging.getLogger(__name__)


@dataclass
class BenchmarkResult:
    """Results from a performance benchmark"""
    name: str
    execution_time: float
    memory_usage: Optional[float] = None
    iterations: int = 1
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BenchmarkSummary:
    """Summary statistics for multiple benchmark runs"""
    name: str
    total_runs: int
    avg_time: float
    min_time: float
    max_time: float
    median_time: float
    std_dev: float
    success_rate: float
    total_time: float


class PerformanceBenchmark:
    """
    Performance benchmarking utility for measuring execution times,
    memory usage, and other performance metrics.
    """
    
    def __init__(self):
        self.results: List[BenchmarkResult] = []
        self.active_benchmarks: Dict[str, float] = {}
    
    @contextmanager
    def measure(self, name: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Context manager for measuring execution time
        
        Args:
            name: Name of the benchmark
            metadata: Additional metadata to store with the result
            
        Example:
            with benchmark.measure("database_query"):
                result = db.query(Model).all()
        """
        start_time = time.perf_counter()
        start_memory = self._get_memory_usage()
        
        try:
            yield
        finally:
            end_time = time.perf_counter()
            end_memory = self._get_memory_usage()
            
            execution_time = end_time - start_time
            memory_delta = end_memory - start_memory if start_memory and end_memory else None
            
            result = BenchmarkResult(
                name=name,
                execution_time=execution_time,
                memory_usage=memory_delta,
                metadata=metadata or {}
            )
            
            self.results.append(result)
            
            if execution_time > 1.0:  # Log slow operations
                logger.warning(f"Slow operation: {name} took {execution_time:.3f}s")
    
    def benchmark_function(self, iterations: int = 1, name: Optional[str] = None):
        """
        Decorator for benchmarking function execution
        
        Args:
            iterations: Number of times to run the function
            name: Custom name for the benchmark
            
        Example:
            @benchmark.benchmark_function(iterations=10)
            def expensive_calculation():
                return complex_operation()
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                benchmark_name = name or f"{func.__module__}.{func.__name__}"
                times = []
                results = []
                
                for i in range(iterations):
                    with self.measure(f"{benchmark_name}_iter_{i}"):
                        result = func(*args, **kwargs)
                        results.append(result)
                        times.append(self.results[-1].execution_time)
                
                # Store summary result
                summary_result = BenchmarkResult(
                    name=benchmark_name,
                    execution_time=statistics.mean(times),
                    iterations=iterations,
                    metadata={
                        'min_time': min(times),
                        'max_time': max(times),
                        'std_dev': statistics.stdev(times) if len(times) > 1 else 0,
                        'total_time': sum(times)
                    }
                )
                self.results.append(summary_result)
                
                return results[0] if iterations == 1 else results
            
            return wrapper
        return decorator
    
    def start_benchmark(self, name: str):
        """Start a named benchmark (for manual timing)"""
        self.active_benchmarks[name] = time.perf_counter()
    
    def end_benchmark(self, name: str, metadata: Optional[Dict[str, Any]] = None):
        """End a named benchmark and record the result"""
        if name not in self.active_benchmarks:
            logger.error(f"No active benchmark found with name: {name}")
            return
        
        start_time = self.active_benchmarks.pop(name)
        execution_time = time.perf_counter() - start_time
        
        result = BenchmarkResult(
            name=name,
            execution_time=execution_time,
            metadata=metadata or {}
        )
        
        self.results.append(result)
        return result
    
    def get_summary(self, name_pattern: Optional[str] = None) -> List[BenchmarkSummary]:
        """
        Get summary statistics for benchmarks
        
        Args:
            name_pattern: Optional pattern to filter benchmark names
            
        Returns:
            List of benchmark summaries
        """
        # Group results by name
        grouped_results: Dict[str, List[BenchmarkResult]] = {}
        
        for result in self.results:
            if name_pattern and name_pattern not in result.name:
                continue
            
            base_name = result.name.split('_iter_')[0]  # Remove iteration suffix
            if base_name not in grouped_results:
                grouped_results[base_name] = []
            grouped_results[base_name].append(result)
        
        summaries = []
        for name, results in grouped_results.items():
            times = [r.execution_time for r in results]
            
            summary = BenchmarkSummary(
                name=name,
                total_runs=len(results),
                avg_time=statistics.mean(times),
                min_time=min(times),
                max_time=max(times),
                median_time=statistics.median(times),
                std_dev=statistics.stdev(times) if len(times) > 1 else 0,
                success_rate=100.0,  # Assume all recorded results are successful
                total_time=sum(times)
            )
            summaries.append(summary)
        
        return sorted(summaries, key=lambda x: x.avg_time, reverse=True)
    
    def get_slow_operations(self, threshold: float = 1.0) -> List[BenchmarkResult]:
        """Get operations that took longer than the threshold"""
        return [r for r in self.results if r.execution_time > threshold]
    
    def clear_results(self):
        """Clear all benchmark results"""
        self.results.clear()
        self.active_benchmarks.clear()
    
    def export_results(self, format: str = 'json') -> str:
        """Export benchmark results in the specified format"""
        if format == 'json':
            import json
            data = []
            for result in self.results:
                data.append({
                    'name': result.name,
                    'execution_time': result.execution_time,
                    'memory_usage': result.memory_usage,
                    'iterations': result.iterations,
                    'timestamp': result.timestamp.isoformat(),
                    'metadata': result.metadata
                })
            return json.dumps(data, indent=2)
        
        elif format == 'csv':
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['name', 'execution_time', 'memory_usage', 'iterations', 'timestamp'])
            
            for result in self.results:
                writer.writerow([
                    result.name,
                    result.execution_time,
                    result.memory_usage,
                    result.iterations,
                    result.timestamp.isoformat()
                ])
            
            return output.getvalue()
        
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _get_memory_usage(self) -> Optional[float]:
        """Get current memory usage in MB"""
        try:
            import psutil
            import os
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / 1024 / 1024  # Convert to MB
        except ImportError:
            return None


# Global benchmark instance
benchmark = PerformanceBenchmark()


# Database query benchmarking
class DatabaseBenchmark:
    """Specialized benchmarking for database operations"""
    
    def __init__(self, db_session):
        self.db = db_session
        self.benchmark = PerformanceBenchmark()
    
    def benchmark_query(self, query_name: str, query_func: Callable):
        """Benchmark a database query"""
        with self.benchmark.measure(f"db_query_{query_name}"):
            return query_func()
    
    def benchmark_crud_operations(self, model_class, sample_data: Dict[str, Any]):
        """Benchmark CRUD operations for a model"""
        results = {}
        
        # Create
        with self.benchmark.measure(f"db_create_{model_class.__name__}"):
            instance = model_class(**sample_data)
            self.db.add(instance)
            self.db.commit()
            results['create'] = instance
        
        # Read
        with self.benchmark.measure(f"db_read_{model_class.__name__}"):
            retrieved = self.db.query(model_class).filter_by(id=instance.id).first()
            results['read'] = retrieved
        
        # Update
        with self.benchmark.measure(f"db_update_{model_class.__name__}"):
            retrieved.updated_at = datetime.now()
            self.db.commit()
            results['update'] = retrieved
        
        # Delete
        with self.benchmark.measure(f"db_delete_{model_class.__name__}"):
            self.db.delete(retrieved)
            self.db.commit()
            results['delete'] = True
        
        return results


# API endpoint benchmarking
def benchmark_api_endpoint(endpoint_name: str):
    """Decorator for benchmarking API endpoints"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            with benchmark.measure(f"api_endpoint_{endpoint_name}"):
                return func(*args, **kwargs)
        return wrapper
    return decorator


# Example usage and tests
def run_performance_tests():
    """Run a suite of performance tests"""
    logger.info("Starting performance benchmark tests...")
    
    # Test basic timing
    with benchmark.measure("test_sleep"):
        time.sleep(0.1)
    
    # Test function benchmarking
    @benchmark.benchmark_function(iterations=5, name="test_calculation")
    def test_calculation():
        return sum(range(10000))
    
    test_calculation()
    
    # Get and log results
    summaries = benchmark.get_summary()
    for summary in summaries:
        logger.info(f"Benchmark: {summary.name}")
        logger.info(f"  Average time: {summary.avg_time:.4f}s")
        logger.info(f"  Min/Max: {summary.min_time:.4f}s / {summary.max_time:.4f}s")
        logger.info(f"  Runs: {summary.total_runs}")
    
    # Check for slow operations
    slow_ops = benchmark.get_slow_operations(threshold=0.05)
    if slow_ops:
        logger.warning(f"Found {len(slow_ops)} slow operations")
        for op in slow_ops:
            logger.warning(f"  {op.name}: {op.execution_time:.4f}s")


if __name__ == "__main__":
    run_performance_tests()