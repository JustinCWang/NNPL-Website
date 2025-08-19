"use client";
/*
  Protected Profile page ("/profile").
  - Shows basic authenticated user information from Supabase
*/
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    // Fetch the current user; layout guarantees access only when authenticated
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-gray-600">Loading profile…</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-gray-600">{email ? `Signed in as ${email}` : "No email found"}</p>
    </main>
  );
}


