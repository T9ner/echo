"""
Caching utilities for performance optimization
"""
import json
import hashlib
from typing import Any, Optional, Dict, Callable
from datetime import datetime, timedelta
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class InMemoryCache:
    """
    Simple in-memory cache for analytics data
    
    This provides fast caching for expensive analytics calculations
    without requiring external dependencies like Redis.
    """
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        """
        Initialize the cache
        
        Args:
            default_ttl: Default time-to-live in seconds
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a cache key from function arguments"""
        # Create a string representation of all arguments
        key_data = {
            'args': args,
            'kwargs': kwargs
        }
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        
        # Create a hash for consistent key length
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        
        return f"{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        # Check if expired
        if datetime.now() > entry['expires_at']:
            del self._cache[key]
            return None
        
        logger.debug(f"Cache hit for key: {key}")
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL"""
        if ttl is None:
            ttl = self.default_ttl
        
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.now()
        }
        
        logger.debug(f"Cache set for key: {key}, TTL: {ttl}s")
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache deleted for key: {key}")
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
        logger.info("Cache cleared")
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed"""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        now = datetime.now()
        active_entries = sum(
            1 for entry in self._cache.values()
            if now <= entry['expires_at']
        )
        
        return {
            'total_entries': len(self._cache),
            'active_entries': active_entries,
            'expired_entries': len(self._cache) - active_entries
        }


# Global cache instance
cache = InMemoryCache(default_ttl=300)  # 5 minutes default


def cached(ttl: int = 300, key_prefix: str = "default"):
    """
    Decorator for caching function results
    
    Args:
        ttl: Time-to-live in seconds
        key_prefix: Prefix for cache keys
        
    Example:
        @cached(ttl=600, key_prefix="analytics")
        def expensive_calculation(param1, param2):
            # Expensive operation
            return result
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(key_prefix, func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        
        # Add cache management methods to the wrapped function
        wrapper.cache_clear = lambda: cache.clear()
        wrapper.cache_delete = lambda *args, **kwargs: cache.delete(
            cache._generate_key(key_prefix, func.__name__, *args, **kwargs)
        )
        
        return wrapper
    return decorator


def cache_analytics_result(ttl: int = 600):
    """
    Specialized decorator for analytics caching
    
    Args:
        ttl: Time-to-live in seconds (default: 10 minutes)
    """
    return cached(ttl=ttl, key_prefix="analytics")


# Background task to cleanup expired entries
def cleanup_cache_periodically():
    """
    Cleanup expired cache entries
    This should be called periodically by a background task
    """
    try:
        removed_count = cache.cleanup_expired()
        if removed_count > 0:
            logger.info(f"Cache cleanup: removed {removed_count} expired entries")
    except Exception as e:
        logger.error(f"Error during cache cleanup: {e}")


# Example usage:
"""
from app.core.cache import cached, cache_analytics_result

@cache_analytics_result(ttl=600)  # Cache for 10 minutes
def get_productivity_overview(start_date, end_date):
    # Expensive analytics calculation
    return analytics_data

# Manual cache operations
cache.set("custom_key", {"data": "value"}, ttl=300)
result = cache.get("custom_key")
cache.delete("custom_key")
"""