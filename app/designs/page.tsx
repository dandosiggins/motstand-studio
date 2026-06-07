"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Design = {
  id: string;
  user_id: string;
  file_url: string;
  file_path: string;
  created_at: string;
};

export default function DesignsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDesigns() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setUser(userData.user);

      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setDesigns(data ?? []);
      setLoading(false);
    }

    loadDesigns();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading designs...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Designs</h1>
            <p className="text-sm text-gray-600">
              Logged in as {user?.email}
            </p>
          </div>

          <a href="/upload" className="rounded border px-4 py-2">
            Upload New Design
          </a>
        </div>

        {message && <p>{message}</p>}

        {designs.length === 0 ? (
          <div className="rounded border p-6">
            <p>You have not uploaded any designs yet.</p>
            <a href="/upload" className="mt-4 inline-block underline">
              Upload your first design
            </a>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {designs.map((design) => (
              <div key={design.id} className="rounded border p-4">
                <img
                  src={design.file_url}
                  alt="Uploaded design"
                  className="h-64 w-full rounded object-contain"
                />

                <p className="mt-3 text-xs text-gray-500">
                  Uploaded:{" "}
                  {new Date(design.created_at).toLocaleString()}
                </p>

                <a
                  href={`/product?designId=${design.id}`}
                  className="mt-4 block rounded border p-2 text-center"
                >
                  Use This Design
                </a>
              </div>
            ))}
          </div>
        )}

        <a href="/dashboard" className="underline">
          Back to dashboard
        </a>
      </div>
    </main>
  );
}