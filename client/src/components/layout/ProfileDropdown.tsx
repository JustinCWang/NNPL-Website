/*
  ProfileDropdown component for header navigation.
  - Displays user avatar or initials in a circular button
  - Shows dropdown menu with username, profile link, and sign out
  - Supports both protected layout and landing page variants
  - Automatically updates when avatar changes via custom events
  - Handles click outside to close dropdown
*/
"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getInitials } from "@/lib/utils";

interface ProfileDropdownProps {
  variant?: 'protected' | 'landing';
}

/**
 * Profile dropdown with avatar and menu options
 * Can be used in both protected layout and landing page
 */
export default function ProfileDropdown({ variant = 'protected' }: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    // Try to get cached avatar URL from localStorage for instant loading
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cached_avatar_url');
    }
    return null;
  });

  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUserData = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        setUserName(user.user_metadata?.name ?? null);
        
        try {
          // Get username, avatar, and role from Users table
          const { data: dbResult } = await supabase
            .from('Users')
            .select('username, avatar_path, role')
            .eq('user_id', user.id)
            .single();
          
          setUsername(dbResult?.username ?? user.email?.split('@')[0] ?? 'User');
          setUserRole(dbResult?.role ?? null);
          const newAvatarUrl = dbResult?.avatar_path ?? null;
          setAvatarUrl(newAvatarUrl);
          setImageError(false); // Reset error state when new avatar URL is set
          
          // Cache the avatar URL in localStorage for instant loading on future visits
          if (typeof window !== 'undefined') {
            if (newAvatarUrl) {
              localStorage.setItem('cached_avatar_url', newAvatarUrl);
            } else {
              localStorage.removeItem('cached_avatar_url');
            }
          }
        } catch {
          // Fallback to email prefix if database query fails
          setUsername(user.email?.split('@')[0] ?? 'User');
          setUserRole(null);
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Listen for custom avatar update events
    const handleAvatarUpdate = () => {
      fetchUserData();
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    
    if (variant === 'landing') {
      window.location.assign("/");
    } else {
      router.replace("/");
    }
  }

  // Get initials for avatar
  const initials = getInitials(userName || 'User');

  // Determine what to show: prioritize image if available and not errored, fallback to initials
  const shouldShowImage = avatarUrl && !imageError;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full text-white text-sm font-medium flex items-center justify-center transition-colors overflow-hidden relative ${
          shouldShowImage 
            ? 'bg-transparent hover:bg-black/10' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
        aria-label="Profile menu"
      >
        {shouldShowImage ? (
          <Image 
            src={avatarUrl} 
            alt="Profile" 
            fill
            className="object-cover"
            onError={() => {
              setImageError(true);
              // Clear cached avatar URL if it fails to load (might be stale)
              if (typeof window !== 'undefined') {
                localStorage.removeItem('cached_avatar_url');
              }
            }}
          />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {/* User info */}
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              {username || 'User'}
            </div>
            
            {/* Navigation links */}
            {variant === 'landing' && (
              <Link
                href="/home"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>

            {/* Admin link - only show for admin users */}
            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
