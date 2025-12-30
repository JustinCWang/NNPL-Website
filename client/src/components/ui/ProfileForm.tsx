"use client";
/*
  ProfileForm component for displaying a profile form.
  - Displays a form for the user to update their profile
  - Displays a form for the user to update their security
  - Displays a form for the user to update their avatar
  - Displays a message when the user submits the form
  - Displays a message when the user submits the form successfully
*/

import { useState, useRef, FormEvent } from "react";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface ProfileFormProps {
  initialData?: {
    username?: string;
    email?: string;
    avatarUrl?: string;
  };
  onUpdate?: () => void;
}

export default function ProfileForm({ initialData, onUpdate }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl || null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handle username update
  const handleUsernameUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const newUsername = String(formData.get("username") || "").trim();
    
    if (!newUsername) {
      showMessage('error', 'Username cannot be empty');
      setIsLoading(false);
      return;
    }

    // Check if username hasn't changed
    if (newUsername === initialData?.username) {
      showMessage('error', 'Please enter a different username to update');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        showMessage('error', 'User not found');
        setIsLoading(false);
        return;
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('Users')
        .select('user_id')
        .eq('username', newUsername)
        .neq('user_id', user.user.id)
        .single();

      if (existingUser) {
        showMessage('error', 'This username is already taken. Please choose a different one.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('Users')
        .update({ username: newUsername })
        .eq('user_id', user.user.id);

      if (error) {
        showMessage('error', `Failed to update username: ${error.message}`);
      } else {
        showMessage('success', 'Username updated successfully!');
        onUpdate?.();
      }
    } catch {
      showMessage('error', 'An unexpected error occurred');
    }
    
    setIsLoading(false);
  };

  // Handle email update
  const handleEmailUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const newEmail = String(formData.get("email") || "").trim();
    
    if (!newEmail) {
      showMessage('error', 'Email cannot be empty');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        showMessage('error', `Failed to update email: ${error.message}`);
      } else {
        showMessage('success', 'Email update initiated! Check your new email for verification.');
      }
    } catch {
      showMessage('error', 'An unexpected error occurred');
    }
    
    setIsLoading(false);
  };

  // Handle password update
  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    
    if (!currentPassword) {
      showMessage('error', 'Current password is required');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      showMessage('error', 'New password must be different from current password');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      // First verify current password by attempting to sign in
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        showMessage('error', 'Unable to verify current user');
        setIsLoading(false);
        return;
      }

      // Test current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword
      });

      if (signInError) {
        showMessage('error', 'Current password is incorrect');
        setIsLoading(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        showMessage('error', `Failed to update password: ${error.message}`);
      } else {
        showMessage('success', 'Password updated successfully!');
        (event.target as HTMLFormElement).reset();
      }
    } catch {
      showMessage('error', 'An unexpected error occurred');
    }
    
    setIsLoading(false);
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 5MB');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        showMessage('error', 'User not found');
        setIsLoading(false);
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, file);

      if (uploadError) {
        showMessage('error', `Upload failed: ${uploadError.message}`);
        setIsLoading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      // Update user record with avatar path
      const { error: updateError } = await supabase
        .from('Users')
        .update({ avatar_path: urlData.publicUrl })
        .eq('user_id', user.user.id);

      if (updateError) {
        showMessage('error', `Failed to update profile: ${updateError.message}`);
      } else {
        setAvatarPreview(urlData.publicUrl);
        showMessage('success', 'Avatar updated successfully!');
        onUpdate?.();
        // Notify other components that avatar was updated
        window.dispatchEvent(new CustomEvent('avatarUpdated'));
      }
    } catch {
      showMessage('error', 'An unexpected error occurred');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Profile Picture</h3>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                ) : (
                  <span className="text-2xl text-gray-500">
                    {initialData?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {isLoading ? 'Uploading...' : 'Change Avatar'}
                </button>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Username Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Username</h3>
            <form onSubmit={handleUsernameUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  name="username"
                  type="text"
                  defaultValue={initialData?.username}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Username'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          {/* Email Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Email Address</h3>
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={initialData?.email}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Changing your email will require verification of the new address.
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
