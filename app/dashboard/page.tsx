"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);
      setLoading(false);
    }

    getUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Not logged in</h1>
          <a href="/login" className="underline">
            Go to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex w-96 flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="text-sm">
          Logged in as: {user.email}
        </p>

        <a href="/upload" className="rounded border p-2 text-center">
  Upload a Design
</a>

<a href="/designs" className="rounded border p-2 text-center">
  My Designs
</a>

 <a href="/orders" className="rounded border p-2 text-center">
  My Orders
</a>       

        <button
          onClick={handleLogout}
          className="rounded border p-2"
        >
          Log Out
        </button>
      </div>
    </main>
  );
}