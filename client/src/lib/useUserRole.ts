/*
  Custom hook for checking user role and admin status.
  - Fetches user role from the Users table
  - Provides loading state and admin status
  - Can be used across components for role-based UI
*/
"use client";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "./supabaseClient";

interface UseUserRoleReturn {
  userRole: string | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Get current user
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        
        if (!user) {
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Get user role from Users table
        const { data: userData, error } = await supabase
          .from('Users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(userData?.role || null);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole(null);
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return {
    userRole,
    isAdmin: userRole === 'admin',
    isLoading,
  };
}
