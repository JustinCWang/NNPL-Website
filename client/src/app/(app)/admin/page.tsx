"use client";
/*
  Admin Dashboard page ("/admin").
  - Only accessible to users with role "admin" in the Users table
  - Redirects non-admin users to home page
  - Shows admin controls and management interface
*/
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StoreManagement from "@/components/admin/StoreManagement";
import EventManagement from "@/components/admin/EventManagement";
import UserManagement from "@/components/admin/UserManagement";

interface AdminStats {
  totalUsers: number;
  activeEvents: number;
  totalStores: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'stores' | 'events' | 'users'>('dashboard');
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeEvents: 0, totalStores: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      const supabase = getSupabaseClient();
      
      // Fetch total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('Users')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
      }

      // Fetch total stores count
      const { count: totalStores, error: storesError } = await supabase
        .from('Stores')
        .select('*', { count: 'exact', head: true });

      if (storesError) {
        console.error('Error fetching stores count:', storesError);
      }

      // Fetch active events count (events that are not yesterday's date)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0]; // Get YYYY-MM-DD format

      const { count: activeEvents, error: eventsError } = await supabase
        .from('Events')
        .select('*', { count: 'exact', head: true })
        .gt('date', yesterdayString);

      if (eventsError) {
        console.error('Error fetching events count:', eventsError);
      }

      setStats({
        totalUsers: totalUsers || 0,
        activeEvents: activeEvents || 0,
        totalStores: totalStores || 0,
      });
      setStatsLoading(false);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Get current user
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        
        if (!user) {
          router.replace("/login");
          return;
        }

        setUserEmail(user.email || null);

        // Check user role from Users table
        const { data: userData, error } = await supabase
          .from('Users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          router.replace("/home");
          return;
        }

        // Check if user has admin or vendor role
        if (userData?.role !== 'admin' && userData?.role !== 'vendor') {
          router.replace("/home");
          return;
        }

        setIsAdmin(userData?.role === 'admin');
        setUserRole(userData?.role || null);
        setIsLoading(false);
        
        // Fetch admin statistics after confirming admin access
        fetchAdminStats();
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.replace("/home");
      }
    };

    checkAdminAccess();
  }, [router]);

  // For vendors, default to events section
  useEffect(() => {
    if (userRole === 'vendor' && activeSection === 'dashboard') {
      setActiveSection('events');
    }
  }, [userRole, activeSection]);

  if (isLoading) {
    return (
      <main>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin && userRole !== 'vendor') {
    return null; // Component will redirect before showing this
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? 'Admin Dashboard' : 'Event Management'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin 
            ? 'Welcome to the admin panel. You have administrative privileges for the NNPL platform.'
            : 'Welcome to the event management panel. You can create and manage tournament events.'
          }
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {isAdmin && (
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard Overview
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveSection('stores')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'stores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Store Management
            </button>
          )}
          <button
            onClick={() => setActiveSection('events')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Event Management
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSection('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
          )}
        </nav>
      </div>

      {/* Content based on active section */}
      {activeSection === 'dashboard' && isAdmin && (
        <>
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Users</h3>
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Events</h3>
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeEvents.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Today and future events</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Stores</h3>
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalStores.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reports</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
                  <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Management */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
              <p className="text-gray-600 mb-4">
                Manage user accounts, roles, and permissions across the platform.
              </p>
              <button 
                onClick={() => setActiveSection('users')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Users
              </button>
            </div>

            {/* Event Management */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Management</h2>
              <p className="text-gray-600 mb-4">
                Create, edit, and manage tournaments and events for the league.
              </p>
              <button 
                onClick={() => setActiveSection('events')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Manage Events
              </button>
            </div>

            {/* Store Management */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Management</h2>
              <p className="text-gray-600 mb-4">
                Add and manage local game stores and their information.
              </p>
              <button 
                onClick={() => setActiveSection('stores')}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Manage Stores
              </button>
            </div>

            {/* System Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
              <p className="text-gray-600 mb-4">
                Configure platform settings, notifications, and system preferences.
              </p>
              <button 
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                disabled
              >
                System Settings (Coming Soon)
              </button>
            </div>
          </div>
        </>
      )}

      {activeSection === 'stores' && isAdmin && (
        <StoreManagement />
      )}

      {activeSection === 'events' && (
        <EventManagement />
      )}

      {activeSection === 'users' && isAdmin && (
        <UserManagement />
      )}

      {/* Session Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900">Session Info</h3>
        <p className="text-sm text-blue-700 mt-1">
          Logged in as: {userEmail}
        </p>
        <p className="text-sm text-blue-700">
          Role: {userRole === 'admin' ? 'Administrator' : userRole === 'vendor' ? 'Vendor' : userRole}
        </p>
      </div>
    </main>
  );
}
