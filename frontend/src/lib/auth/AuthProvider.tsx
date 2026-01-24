import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@lib/api/client';

interface User {
  id: number;
  username: string;
  email: string;
  isPremium: boolean;
  subscriptionStatus: string;
  remainingSimulations: number;
}

interface UserStats {
  simulationsToday: number;
  remainingToday: number;
  isPremium: boolean;
  subscriptionStatus: string;
  blueprintsCreated: number;
  challengesCompleted: number;
}

interface AuthContextType {
  user: User | null;
  userStats: UserStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canRunSimulation: boolean;
  refetchUserStats: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from WordPress data
    const wpData = window.infinityData;
    if (wpData?.isUserLoggedIn && wpData.currentUserId) {
      return {
        id: wpData.currentUserId,
        username: '', // Will be fetched
        email: '', // Will be fetched
        isPremium: false, // Will be fetched
        subscriptionStatus: 'none', // Will be fetched
        remainingSimulations: 2, // Will be fetched
      };
    }
    return null;
  });

  const isAuthenticated = !!user && user.id > 0;

  // Fetch user stats
  const {
    data: userStats,
    isLoading,
    refetch: refetchUserStats,
  } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      if (!isAuthenticated) return null;

      const response = await apiClient.get('/user/stats');
      return response.data as UserStats;
    },
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
  });

  // Update user when stats are fetched
  useEffect(() => {
    if (userStats && user) {
      setUser((prev) => ({
        ...prev!,
        isPremium: userStats.isPremium,
        subscriptionStatus: userStats.subscriptionStatus,
        remainingSimulations: userStats.remainingToday,
      }));
    }
  }, [userStats]);

  // Check if user can run simulation
  const canRunSimulation = !isAuthenticated
    ? (userStats?.remainingToday ?? 2) > 0
    : user?.isPremium || (user?.remainingSimulations ?? 0) > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        userStats,
        isLoading,
        isAuthenticated,
        canRunSimulation,
        refetchUserStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
