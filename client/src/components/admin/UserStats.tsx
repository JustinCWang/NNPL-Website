"use client";
/*
  UserStats component for displaying user statistics in the admin dashboard.
  - Shows total user count
  - Displays role distribution with percentages
  - Recent user registrations
  - Visual charts and progress bars
*/

import { User, UserRoleStats, USER_ROLES } from '@/types/user';

interface UserStatsProps {
  users: User[];
  isLoading?: boolean;
}

export default function UserStats({ users, isLoading = false }: UserStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="theme-card p-6 rounded-lg">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalUsers = users.length;
  
  // Calculate role statistics
  const roleStats: UserRoleStats[] = USER_ROLES.map(role => {
    const count = users.filter(user => user.role === role.value).length;
    const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
    return {
      role: role.value,
      count,
      percentage
    };
  });

  // Get recent users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = users.filter(user => 
    new Date(user.date_joined) >= thirtyDaysAgo
  ).length;

  // Get users joined this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyUsers = users.filter(user => 
    new Date(user.date_joined) >= oneWeekAgo
  ).length;

  // Get most recent user
  const mostRecentUser = users.length > 0 
    ? users.reduce((latest, user) => 
        new Date(user.date_joined) > new Date(latest.date_joined) ? user : latest
      )
    : null;

  const getRoleLabel = (roleValue: string) => {
    return USER_ROLES.find(role => role.value === roleValue)?.label || roleValue;
  };

  const getRoleColor = (roleValue: string) => {
    switch (roleValue) {
      case 'admin':
        return 'bg-red-500';
      case 'competitor':
        return 'bg-yellow-500';
      case 'vendor':
        return 'bg-green-500';
      case 'member':
      default:
        return 'bg-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="theme-card p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="theme-chip w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-theme-muted">Total Users</h3>
              <p className="text-2xl font-bold text-theme-foreground">{totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Recent Users (30 days) */}
        <div className="theme-card p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="theme-chip w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-theme-muted">New (30 days)</h3>
              <p className="text-2xl font-bold text-theme-foreground">{recentUsers}</p>
            </div>
          </div>
        </div>

        {/* Weekly Users */}
        <div className="theme-card p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="theme-chip w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-theme-muted">This Week</h3>
              <p className="text-2xl font-bold text-theme-foreground">{weeklyUsers}</p>
            </div>
          </div>
        </div>

        {/* Most Recent User */}
        <div className="theme-card p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="theme-chip w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-theme-muted">Latest User</h3>
              {mostRecentUser ? (
                <div>
                  <p className="text-sm font-medium text-theme-foreground">{mostRecentUser.username}</p>
                  <p className="text-xs text-theme-muted">{formatDate(mostRecentUser.date_joined)}</p>
                </div>
              ) : (
                <p className="text-sm text-theme-muted">No users yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="theme-card p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-theme-foreground mb-4">User Role Distribution</h3>
        
        <div className="space-y-4">
          {roleStats.map((stat) => (
            <div key={stat.role} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center min-w-0">
                  <div className={`w-3 h-3 rounded-full ${getRoleColor(stat.role)} mr-3`}></div>
                  <span className="text-sm font-medium text-theme-foreground">
                    {getRoleLabel(stat.role)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="w-24 rounded-full h-2" style={{ backgroundColor: "var(--theme-table-header)" }}>
                    <div
                      className={`h-2 rounded-full ${getRoleColor(stat.role)}`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium text-theme-foreground">{stat.count}</span>
                  <span className="text-theme-muted">
                    ({stat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalUsers === 0 && (
          <div className="text-center py-8 text-theme-muted">
            <p>No users to display statistics for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
