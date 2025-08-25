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

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'stores' | 'events'>('dashboard');

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

        // Check if user has admin role
        if (userData?.role !== 'admin') {
          router.replace("/home");
          return;
        }

        setIsAdmin(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.replace("/home");
      }
    };

    checkAdminAccess();
  }, [router]);

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

  if (!isAdmin) {
    return null; // Component will redirect before showing this
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the admin panel. You have administrative privileges for the NNPL platform.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
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
        </nav>
      </div>

      {/* Content based on active section */}
      {activeSection === 'dashboard' && (
        <>
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Events</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Stores</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reports</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                disabled
              >
                Manage Users (Coming Soon)
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

      {activeSection === 'stores' && (
        <StoreManagement />
      )}

      {activeSection === 'events' && (
        <EventManagement />
      )}

      {/* Admin Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900">Admin Session Info</h3>
        <p className="text-sm text-blue-700 mt-1">
          Logged in as: {userEmail}
        </p>
        <p className="text-sm text-blue-700">
          Role: Administrator
        </p>
      </div>
    </main>
  );
}
