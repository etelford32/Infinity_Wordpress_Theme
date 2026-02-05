export { AuthProvider, useAuth, type User } from './AuthProvider';
export {
  UserRole,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  isRoleHigher,
  isRoleAtLeast,
  getRoleDisplayName,
  getRoleColor,
  getRoleBadgeClasses,
} from './roles';
