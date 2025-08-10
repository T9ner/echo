"""
Performance test suite for ECHO AI Assistant

This script runs comprehensive performance tests to identify bottlenecks
and ensure the application meets performance requirements.
"""
import asyncio
import time
import statistics
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import application components
from app.core.database import SessionLocal, create_tables
from app.services.task_service import TaskService
from app.services.habit_service import HabitService
from app.services.analytics_service import AnalyticsService
from app.models.task import Task
from app.models.habit import Habit
from app.models.enums import TaskStatus, TaskPriority, HabitFrequency
from app.schemas.task import TaskCreate
from app.schemas.habit import HabitCreate
from app.core.benchmarks import benchmark, DatabaseBenchmark


class PerformanceTestSuite:
    """Comprehensive performance test suite"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.task_service = TaskService(self.db)
        self.habit_service = HabitService(self.db)
        self.analytics_service = AnalyticsService(self.db)
        self.db_benchmark = DatabaseBenchmark(self.db)
        
        # Test data
        self.test_tasks = []
        self.test_habits = []
    
    def setup_test_data(self, num_tasks: int = 1000, num_habits: int = 50):
        """Create test data for performance testing"""
        logger.info(f"Creating {num_tasks} test tasks and {num_habits} test habits...")
        
        # Create test tasks
        for i in range(num_tasks):
            task_data = TaskCreate(
                title=f"Test Task {i}",
                description=f"Description for test task {i}",
                priority=TaskPriority.MEDIUM if i % 3 == 0 else TaskPriority.HIGH,
                status=TaskStatus.COMPLETED if i % 4 == 0 else TaskStatus.TODO
            )
            
            with benchmark.measure(f"create_task_{i}"):
                task = self.task_service.create_task(task_data)
                self.test_tasks.append(task)
        
        # Create test habits
        for i in range(num_habits):
            habit_data = HabitCreate(
                name=f"Test Habit {i}",
                description=f"Description for test habit {i}",
                frequency=HabitFrequency.DAILY if i % 2 == 0 else HabitFrequency.WEEKLY
            )
            
            with benchmark.measure(f"create_habit_{i}"):
                habit = self.habit_service.create_habit(habit_data)
                self.test_habits.append(habit)
        
        logger.info("Test data created successfully")
    
    def test_task_operations(self):
        """Test task-related operations performance"""
        logger.info("Testing task operations performance...")
        
        # Test bulk task retrieval
        with benchmark.measure("get_all_tasks_bulk"):
            tasks = self.task_service.get_all_tasks(limit=1000)
        
        logger.info(f"Retrieved {len(tasks)} tasks")
        
        # Test filtered task retrieval
        with benchmark.measure("get_tasks_filtered_status"):
            completed_tasks = self.task_service.get_all_tasks(status=TaskStatus.COMPLETED)
        
        with benchmark.measure("get_tasks_filtered_priority"):
            high_priority_tasks = self.task_service.get_all_tasks(priority=TaskPriority.HIGH)
        
        # Test task search
        with benchmark.measure("search_tasks"):
            search_results = self.task_service.get_all_tasks(search="Test")
        
        # Test individual task operations
        if self.test_tasks:
            test_task = self.test_tasks[0]
            
            with benchmark.measure("get_task_by_id"):
                retrieved_task = self.task_service.get_task_by_id(test_task.id)
            
            with benchmark.measure("update_task"):
                from app.schemas.task import TaskUpdate
                update_data = TaskUpdate(description="Updated description")
                updated_task = self.task_service.update_task(test_task.id, update_data)
        
        logger.info("Task operations performance test completed")
    
    def test_analytics_performance(self):
        """Test analytics operations performance"""
        logger.info("Testing analytics performance...")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Test productivity overview (most expensive operation)
        with benchmark.measure("analytics_productivity_overview"):
            overview = self.analytics_service.get_productivity_overview(start_date, end_date)
        
        # Test with different date ranges
        with benchmark.measure("analytics_7_days"):
            week_overview = self.analytics_service.get_productivity_overview(
                end_date - timedelta(days=7), end_date
            )
        
        with benchmark.measure("analytics_90_days"):
            quarter_overview = self.analytics_service.get_productivity_overview(
                end_date - timedelta(days=90), end_date
            )
        
        logger.info("Analytics performance test completed")
    
    def test_database_performance(self):
        """Test database-specific performance"""
        logger.info("Testing database performance...")
        
        # Test CRUD operations
        sample_task_data = {
            'title': 'Performance Test Task',
            'description': 'Task for performance testing',
            'status': TaskStatus.TODO,
            'priority': TaskPriority.MEDIUM
        }
        
        crud_results = self.db_benchmark.benchmark_crud_operations(Task, sample_task_data)
        
        # Test bulk operations
        with benchmark.measure("bulk_task_query"):
            tasks = self.db.query(Task).limit(500).all()
        
        with benchmark.measure("bulk_task_count"):
            task_count = self.db.query(Task).count()
        
        # Test complex queries
        with benchmark.measure("complex_task_query"):
            complex_results = self.db.query(Task).filter(
                Task.status == TaskStatus.COMPLETED,
                Task.priority.in_([TaskPriority.HIGH, TaskPriority.URGENT])
            ).order_by(Task.created_at.desc()).limit(100).all()
        
        logger.info("Database performance test completed")
    
    def test_concurrent_operations(self, num_concurrent: int = 10):
        """Test performance under concurrent load"""
        logger.info(f"Testing concurrent operations with {num_concurrent} threads...")
        
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def worker():
            """Worker function for concurrent testing"""
            start_time = time.time()
            
            # Perform various operations
            tasks = self.task_service.get_all_tasks(limit=50)
            
            if self.test_tasks:
                task = self.task_service.get_task_by_id(self.test_tasks[0].id)
            
            end_time = time.time()
            results_queue.put(end_time - start_time)
        
        # Start concurrent workers
        threads = []
        start_time = time.time()
        
        for i in range(num_concurrent):
            thread = threading.Thread(target=worker)
            thread.start()
            threads.append(thread)
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        total_time = time.time() - start_time
        
        # Collect results
        execution_times = []
        while not results_queue.empty():
            execution_times.append(results_queue.get())
        
        if execution_times:
            avg_time = statistics.mean(execution_times)
            max_time = max(execution_times)
            min_time = min(execution_times)
            
            logger.info(f"Concurrent test results:")
            logger.info(f"  Total time: {total_time:.3f}s")
            logger.info(f"  Average operation time: {avg_time:.3f}s")
            logger.info(f"  Min/Max operation time: {min_time:.3f}s / {max_time:.3f}s")
            logger.info(f"  Operations per second: {num_concurrent / total_time:.2f}")
    
    def test_memory_usage(self):
        """Test memory usage patterns"""
        logger.info("Testing memory usage...")
        
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Perform memory-intensive operations
            with benchmark.measure("memory_intensive_analytics"):
                for i in range(10):
                    overview = self.analytics_service.get_productivity_overview()
            
            # Force garbage collection
            import gc
            gc.collect()
            
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_delta = final_memory - initial_memory
            
            logger.info(f"Memory usage:")
            logger.info(f"  Initial: {initial_memory:.2f} MB")
            logger.info(f"  Final: {final_memory:.2f} MB")
            logger.info(f"  Delta: {memory_delta:.2f} MB")
            
        except ImportError:
            logger.warning("psutil not available, skipping memory usage test")
    
    def run_all_tests(self):
        """Run the complete performance test suite"""
        logger.info("Starting comprehensive performance test suite...")
        
        start_time = time.time()
        
        try:
            # Setup
            self.setup_test_data(num_tasks=500, num_habits=25)  # Reduced for faster testing
            
            # Run tests
            self.test_task_operations()
            self.test_analytics_performance()
            self.test_database_performance()
            self.test_concurrent_operations(num_concurrent=5)
            self.test_memory_usage()
            
            # Generate report
            self.generate_performance_report()
            
        except Exception as e:
            logger.error(f"Performance test failed: {e}")
            raise
        
        finally:
            # Cleanup
            self.cleanup_test_data()
            self.db.close()
        
        total_time = time.time() - start_time
        logger.info(f"Performance test suite completed in {total_time:.2f}s")
    
    def generate_performance_report(self):
        """Generate a comprehensive performance report"""
        logger.info("Generating performance report...")
        
        summaries = benchmark.get_summary()
        slow_operations = benchmark.get_slow_operations(threshold=0.1)
        
        print("\n" + "="*80)
        print("ECHO AI ASSISTANT - PERFORMANCE REPORT")
        print("="*80)
        
        print(f"\nTest completed at: {datetime.now()}")
        print(f"Total benchmarks: {len(benchmark.results)}")
        
        print(f"\nTOP 10 SLOWEST OPERATIONS:")
        print("-" * 50)
        for i, summary in enumerate(summaries[:10]):
            print(f"{i+1:2d}. {summary.name:<30} {summary.avg_time:.4f}s (±{summary.std_dev:.4f}s)")
        
        if slow_operations:
            print(f"\nSLOW OPERATIONS (>0.1s):")
            print("-" * 50)
            for op in slow_operations[:10]:
                print(f"    {op.name:<30} {op.execution_time:.4f}s")
        
        print(f"\nPERFORMANCE RECOMMENDATIONS:")
        print("-" * 50)
        
        # Analyze results and provide recommendations
        analytics_ops = [s for s in summaries if 'analytics' in s.name.lower()]
        if analytics_ops and analytics_ops[0].avg_time > 1.0:
            print("  • Consider implementing more aggressive caching for analytics")
        
        db_ops = [s for s in summaries if 'db_' in s.name or 'task' in s.name]
        if db_ops and any(op.avg_time > 0.5 for op in db_ops):
            print("  • Database queries may benefit from additional indexes")
        
        bulk_ops = [s for s in summaries if 'bulk' in s.name.lower()]
        if bulk_ops and any(op.avg_time > 0.2 for op in bulk_ops):
            print("  • Consider implementing pagination for large result sets")
        
        print("  • Monitor these metrics in production")
        print("  • Set up alerts for operations exceeding thresholds")
        
        print("\n" + "="*80)
    
    def cleanup_test_data(self):
        """Clean up test data"""
        logger.info("Cleaning up test data...")
        
        try:
            # Delete test tasks
            for task in self.test_tasks:
                self.task_service.delete_task(task.id)
            
            # Delete test habits
            for habit in self.test_habits:
                self.habit_service.delete_habit(habit.id)
            
            logger.info("Test data cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")


def main():
    """Main function to run performance tests"""
    # Ensure database tables exist
    create_tables()
    
    # Run performance tests
    test_suite = PerformanceTestSuite()
    test_suite.run_all_tests()


if __name__ == "__main__":
    main()