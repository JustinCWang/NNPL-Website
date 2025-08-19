"use client";
/*
  Protected Profile page ("/profile").
  - Shows comprehensive profile management interface
  - Allows users to update username, email, password, and avatar
*/
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ProfileForm from "@/components/ui/ProfileForm";

interface UserData {
  username: string;
  email: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const supabase = getSupabaseClient();
      
      // Get auth user data
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user profile data from database
      const { data: profileData } = await supabase
        .from('Users')
        .select('username, email, avatar_path')
        .eq('user_id', user.id)
        .single();

      setUserData({
        username: profileData?.username || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatarUrl: profileData?.avatar_path || undefined
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-gray-600">Loading your profile information...</p>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>
      
      {userData ? (
        <ProfileForm 
          initialData={userData} 
          onUpdate={fetchUserData}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Unable to load profile data. Please try refreshing the page.</p>
        </div>
      )}
    </main>
  );
}


