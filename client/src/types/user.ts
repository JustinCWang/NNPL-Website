/*
  TypeScript types for User entity and related operations.
  Based on the Users table schema: user_id, username, role, date_joined, avatar_path, email
*/

export interface User {
  user_id: string;
  username: string;
  role: string;
  date_joined: string;
  avatar_path?: string | null;
  email: string;
}

export interface UpdateUserData {
  user_id: string;
  role: string;
}

export interface UserSearchFilters {
  username: string;
  role: string;
  dateFrom: string;
  dateTo: string;
}

export interface UserRoleStats {
  role: string;
  count: number;
  percentage: number;
}

// Available user roles
export const USER_ROLES = [
  { value: 'member', label: 'Member', description: 'Regular member with basic access' },
  { value: 'competitor', label: 'Competitor', description: 'Competitive player with enhanced access' },
  { value: 'vendor', label: 'Vendor', description: 'Store vendor with event management access' },
  { value: 'admin', label: 'Admin', description: 'Administrator with full access' },
] as const;

export type UserRole = typeof USER_ROLES[number]['value'];
