import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  database?: 'connected' | 'disconnected';
}

export const useApiHealth = () => {
  return useQuery({
    queryKey: ['api', 'health'],
    queryFn: async (): Promise<HealthStatus> => {
      try {
        const response = await api.get('/health');
        return response.data;
      } catch (error) {
        // If health endpoint doesn't exist, try a simple request
        try {
          await api.get('/tasks?limit=1');
          return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
          };
        } catch {
          throw error;
        }
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
    refetchInterval: 60 * 1000, // Check every minute
  });
};