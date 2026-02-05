import { useState, useEffect, memo } from 'react';
import {
  FaUsers,
  FaSearch,
  FaUserShield,
  FaUserCog,
  FaBan,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { apiClient } from '@lib/api/client';
import { UserRole, getRoleDisplayName, getRoleBadgeClasses } from '@lib/auth/roles';

interface ManagedUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  registeredAt: string;
  lastLogin?: string;
  simulationsRun: number;
  blueprintsCreated: number;
}

interface UserRowProps {
  user: ManagedUser;
  onRoleChange: (userId: number, newRole: UserRole) => void;
  onStatusChange: (userId: number, newStatus: 'active' | 'suspended') => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const UserRow = memo(function UserRow({
  user,
  onRoleChange,
  onStatusChange,
  isExpanded,
  onToggleExpand,
}: UserRowProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roleOptions = [
    UserRole.FREE,
    UserRole.SUBSCRIBER,
    UserRole.MODERATOR,
    UserRole.ADMIN,
  ];

  return (
    <div className="border-b border-[var(--bg-tertiary)] last:border-b-0">
      <div
        className="p-4 flex items-center gap-4 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]">
              <span className="text-white font-bold">
                {user.displayName?.charAt(0) || user.username.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)] truncate">
              {user.displayName || user.username}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeClasses(
                user.role
              )}`}
            >
              {getRoleDisplayName(user.role)}
            </span>
            {user.status === 'suspended' && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Suspended
              </span>
            )}
          </div>
          <span className="text-sm text-[var(--text-tertiary)]">{user.email}</span>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-[var(--text-primary)] font-medium">
              {user.simulationsRun}
            </div>
            <div className="text-[var(--text-tertiary)]">Simulations</div>
          </div>
          <div className="text-center">
            <div className="text-[var(--text-primary)] font-medium">
              {user.blueprintsCreated}
            </div>
            <div className="text-[var(--text-tertiary)]">Blueprints</div>
          </div>
        </div>

        {/* Expand Icon */}
        <div className="text-[var(--text-tertiary)]">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-[var(--bg-tertiary)]/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Account Details
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Registered:</span>
                  <span className="text-[var(--text-secondary)]">
                    {new Date(user.registeredAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Last Login:</span>
                  <span className="text-[var(--text-secondary)]">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Status:</span>
                  <span
                    className={
                      user.status === 'active' ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Management */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Role Management
              </h4>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRoleDropdown(!showRoleDropdown);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FaUserShield className="text-[var(--accent-primary)]" />
                    {getRoleDisplayName(user.role)}
                  </span>
                  <FaChevronDown
                    className={`transition-transform ${
                      showRoleDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg shadow-lg z-10">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRoleChange(user.id, role);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-[var(--bg-tertiary)] transition-colors ${
                          user.role === role
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {getRoleDisplayName(role)}
                        {user.role === role && (
                          <FaCheck className="inline ml-2 text-xs" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Quick Actions
              </h4>
              <div className="flex flex-col gap-2">
                {user.status === 'active' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(user.id, 'suspended');
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                  >
                    <FaBan />
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(user.id, 'active');
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 text-green-500 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition-colors"
                  >
                    <FaCheck />
                    Reactivate User
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`mailto:${user.email}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--bg-tertiary)] rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <FaUserCog />
                  Contact User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Mock data for development
      setUsers([
        {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          displayName: 'John Doe',
          role: UserRole.SUBSCRIBER,
          status: 'active',
          registeredAt: '2024-01-15T10:00:00Z',
          lastLogin: '2024-02-01T14:30:00Z',
          simulationsRun: 45,
          blueprintsCreated: 3,
        },
        {
          id: 2,
          username: 'jane_smith',
          email: 'jane@example.com',
          displayName: 'Jane Smith',
          role: UserRole.FREE,
          status: 'active',
          registeredAt: '2024-01-20T08:00:00Z',
          lastLogin: '2024-02-02T09:15:00Z',
          simulationsRun: 12,
          blueprintsCreated: 0,
        },
        {
          id: 3,
          username: 'mod_mike',
          email: 'mike@example.com',
          displayName: 'Mike Moderator',
          role: UserRole.MODERATOR,
          status: 'active',
          registeredAt: '2023-12-01T12:00:00Z',
          lastLogin: '2024-02-03T16:45:00Z',
          simulationsRun: 120,
          blueprintsCreated: 15,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      console.error('Failed to update role:', error);
      // Still update locally for demo
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  };

  const handleStatusChange = async (
    userId: number,
    newStatus: 'active' | 'suspended'
  ) => {
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      // Still update locally for demo
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const roleOptions: (UserRole | 'all')[] = [
    'all',
    UserRole.FREE,
    UserRole.SUBSCRIBER,
    UserRole.MODERATOR,
    UserRole.ADMIN,
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--bg-tertiary)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaUsers className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              User Management
            </h3>
          </div>
          <span className="text-sm text-[var(--text-tertiary)]">
            {filteredUsers.length} users
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : getRoleDisplayName(role as UserRole)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <FaUsers className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
            <p className="text-[var(--text-secondary)]">No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onRoleChange={handleRoleChange}
              onStatusChange={handleStatusChange}
              isExpanded={expandedUserId === user.id}
              onToggleExpand={() =>
                setExpandedUserId(expandedUserId === user.id ? null : user.id)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default UserManagement;
