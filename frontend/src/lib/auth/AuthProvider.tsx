import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@lib/api/client';
import { UserRole, Permission, hasPermission, isRoleAtLeast } from './roles';

interface UserSubscription {
  tierId: string;
  tierName: string;
  status: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  isPremium: boolean;
  subscriptionStatus: string;
  remainingSimulations: number;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
  occupation?: string;
  subscription?: UserSubscription;
  role: UserRole;
  permissions?: Permission[];
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
  updateUser: (data: Partial<User>) => void;
  // Role-based utilities
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isRoleAtLeast: (minRole: UserRole) => boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isSubscriber: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Determine user role based on WordPress data and subscription status
 */
function determineUserRole(wpData: any, isPremium: boolean): UserRole {
  // Check WordPress capabilities
  if (wpData?.isAdmin || wpData?.capabilities?.manage_options) {
    return UserRole.ADMIN;
  }
  if (wpData?.isModerator || wpData?.capabilities?.moderate_comments) {
    return UserRole.MODERATOR;
  }
  if (isPremium) {
    return UserRole.SUBSCRIBER;
  }
  if (wpData?.isUserLoggedIn) {
    return UserRole.FREE;
  }
  return UserRole.GUEST;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from WordPress data
    const wpData = window.infinityData;
    if (wpData?.isUserLoggedIn && wpData.currentUserId) {
      const role = determineUserRole(wpData, false);
      return {
        id: wpData.currentUserId,
        username: (wpData as any).username || '',
        email: (wpData as any).email || '',
        isPremium: false,
        subscriptionStatus: 'none',
        remainingSimulations: 2,
        displayName: (wpData as any).displayName,
        avatarUrl: (wpData as any).avatarUrl,
        role,
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
    refetchInterval: 60000,
  });

  // Update user when stats are fetched
  useEffect(() => {
    if (userStats && user) {
      const wpData = window.infinityData;
      const newRole = determineUserRole(wpData, userStats.isPremium);

      setUser((prev) => ({
        ...prev!,
        isPremium: userStats.isPremium,
        subscriptionStatus: userStats.subscriptionStatus,
        remainingSimulations: userStats.remainingToday,
        role: newRole,
      }));
    }
  }, [userStats]);

  // Check if user can run simulation
  const canRunSimulation = !isAuthenticated
    ? (userStats?.remainingToday ?? 2) > 0
    : user?.isPremium || (user?.remainingSimulations ?? 0) > 0;

  // Update user data
  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  // Role-based permission checks
  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return hasPermission(UserRole.GUEST, permission);
      return hasPermission(user.role, permission);
    },
    [user]
  );

  const checkAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((p) => checkPermission(p));
    },
    [checkPermission]
  );

  const checkAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((p) => checkPermission(p));
    },
    [checkPermission]
  );

  const checkRoleAtLeast = useCallback(
    (minRole: UserRole): boolean => {
      const currentRole = user?.role ?? UserRole.GUEST;
      return isRoleAtLeast(currentRole, minRole);
    },
    [user]
  );

  // Convenience role checks
  const isAdmin = user?.role === UserRole.ADMIN;
  const isModerator = isRoleAtLeast(user?.role ?? UserRole.GUEST, UserRole.MODERATOR);
  const isSubscriber = isRoleAtLeast(user?.role ?? UserRole.GUEST, UserRole.SUBSCRIBER);

  return (
    <AuthContext.Provider
      value={{
        user,
        userStats: userStats ?? null,
        isLoading,
        isAuthenticated,
        canRunSimulation,
        refetchUserStats,
        updateUser,
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        isRoleAtLeast: checkRoleAtLeast,
        isAdmin,
        isModerator,
        isSubscriber,
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

// Re-export role utilities for convenience
export { UserRole, Permission } from './roles';
