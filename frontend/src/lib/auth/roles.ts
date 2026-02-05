/**
 * User Role System
 * Defines roles, permissions, and utilities for role-based access control
 */

export enum UserRole {
  GUEST = 'guest',
  FREE = 'free',
  SUBSCRIBER = 'subscriber',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum Permission {
  // Simulation permissions
  VIEW_SIMULATIONS = 'view_simulations',
  RUN_SIMULATIONS = 'run_simulations',
  RUN_PREMIUM_SIMULATIONS = 'run_premium_simulations',
  UNLIMITED_SIMULATIONS = 'unlimited_simulations',

  // Blueprint permissions
  VIEW_BLUEPRINTS = 'view_blueprints',
  CREATE_BLUEPRINTS = 'create_blueprints',
  EDIT_OWN_BLUEPRINTS = 'edit_own_blueprints',
  DELETE_OWN_BLUEPRINTS = 'delete_own_blueprints',
  EDIT_ANY_BLUEPRINT = 'edit_any_blueprint',
  DELETE_ANY_BLUEPRINT = 'delete_any_blueprint',
  FEATURE_BLUEPRINTS = 'feature_blueprints',

  // Challenge permissions
  VIEW_CHALLENGES = 'view_challenges',
  PARTICIPATE_CHALLENGES = 'participate_challenges',
  CREATE_CHALLENGES = 'create_challenges',
  MANAGE_CHALLENGES = 'manage_challenges',

  // User management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  BAN_USERS = 'ban_users',
  CHANGE_USER_ROLES = 'change_user_roles',

  // Content moderation
  MODERATE_CONTENT = 'moderate_content',
  VIEW_REPORTS = 'view_reports',
  RESOLVE_REPORTS = 'resolve_reports',

  // Admin permissions
  ACCESS_ADMIN_DASHBOARD = 'access_admin_dashboard',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_SUBSCRIPTIONS = 'manage_subscriptions',
  VIEW_PERFORMANCE_METRICS = 'view_performance_metrics',
}

// Role permission mappings
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.VIEW_SIMULATIONS,
    Permission.VIEW_BLUEPRINTS,
    Permission.VIEW_CHALLENGES,
  ],

  [UserRole.FREE]: [
    Permission.VIEW_SIMULATIONS,
    Permission.RUN_SIMULATIONS,
    Permission.VIEW_BLUEPRINTS,
    Permission.VIEW_CHALLENGES,
    Permission.PARTICIPATE_CHALLENGES,
  ],

  [UserRole.SUBSCRIBER]: [
    Permission.VIEW_SIMULATIONS,
    Permission.RUN_SIMULATIONS,
    Permission.RUN_PREMIUM_SIMULATIONS,
    Permission.UNLIMITED_SIMULATIONS,
    Permission.VIEW_BLUEPRINTS,
    Permission.CREATE_BLUEPRINTS,
    Permission.EDIT_OWN_BLUEPRINTS,
    Permission.DELETE_OWN_BLUEPRINTS,
    Permission.VIEW_CHALLENGES,
    Permission.PARTICIPATE_CHALLENGES,
  ],

  [UserRole.MODERATOR]: [
    Permission.VIEW_SIMULATIONS,
    Permission.RUN_SIMULATIONS,
    Permission.RUN_PREMIUM_SIMULATIONS,
    Permission.UNLIMITED_SIMULATIONS,
    Permission.VIEW_BLUEPRINTS,
    Permission.CREATE_BLUEPRINTS,
    Permission.EDIT_OWN_BLUEPRINTS,
    Permission.DELETE_OWN_BLUEPRINTS,
    Permission.EDIT_ANY_BLUEPRINT,
    Permission.DELETE_ANY_BLUEPRINT,
    Permission.FEATURE_BLUEPRINTS,
    Permission.VIEW_CHALLENGES,
    Permission.PARTICIPATE_CHALLENGES,
    Permission.MANAGE_CHALLENGES,
    Permission.VIEW_USERS,
    Permission.MODERATE_CONTENT,
    Permission.VIEW_REPORTS,
    Permission.RESOLVE_REPORTS,
    Permission.ACCESS_ADMIN_DASHBOARD,
    Permission.VIEW_ANALYTICS,
  ],

  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],
};

// Role hierarchy (higher index = higher rank)
const roleHierarchy: UserRole[] = [
  UserRole.GUEST,
  UserRole.FREE,
  UserRole.SUBSCRIBER,
  UserRole.MODERATOR,
  UserRole.ADMIN,
];

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Check if roleA is higher than roleB in the hierarchy
 */
export function isRoleHigher(roleA: UserRole, roleB: UserRole): boolean {
  return roleHierarchy.indexOf(roleA) > roleHierarchy.indexOf(roleB);
}

/**
 * Check if roleA is at least as high as roleB
 */
export function isRoleAtLeast(roleA: UserRole, minRole: UserRole): boolean {
  return roleHierarchy.indexOf(roleA) >= roleHierarchy.indexOf(minRole);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.GUEST]: 'Guest',
    [UserRole.FREE]: 'Free User',
    [UserRole.SUBSCRIBER]: 'Premium Subscriber',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.ADMIN]: 'Administrator',
  };
  return displayNames[role] ?? role;
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    [UserRole.GUEST]: 'gray',
    [UserRole.FREE]: 'blue',
    [UserRole.SUBSCRIBER]: 'purple',
    [UserRole.MODERATOR]: 'green',
    [UserRole.ADMIN]: 'red',
  };
  return colors[role] ?? 'gray';
}

/**
 * Get role badge classes for Tailwind
 */
export function getRoleBadgeClasses(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    [UserRole.GUEST]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    [UserRole.FREE]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    [UserRole.SUBSCRIBER]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    [UserRole.MODERATOR]: 'bg-green-500/20 text-green-400 border-green-500/30',
    [UserRole.ADMIN]: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return classes[role] ?? classes[UserRole.GUEST];
}
