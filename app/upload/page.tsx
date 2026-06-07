"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setLoading(false);
    }

    getUser();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setMessage("You must be logged in.");
      return;
    }

    if (!file) {
      setMessage("Please choose a file first.");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a PNG or JPG image.");
      return;
    }

    setUploading(true);
    setMessage("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("designs")
      .upload(filePath, file);

    if (error) {
      setUploading(false);
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("designs")
      .getPublicUrl(filePath);

    setUploadedUrl(data.publicUrl);
    setMessage("Design uploaded successfully!");
    setUploading(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Upload Design</h1>
          <p className="text-sm text-gray-600">
            Upload a PNG or JPG design for your shirt.
          </p>
        </div>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setMessage("");
              setUploadedUrl("");
            }}
            className="rounded border p-2"
          />

          <button
            type="submit"
            disabled={uploading}
            className="rounded border p-2 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Design"}
          </button>
        </form>

        {message && <p className="text-sm">{message}</p>}

        {uploadedUrl && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Preview:</p>
            <img
              src={uploadedUrl}
              alt="Uploaded design"
              className="max-h-80 rounded border object-contain"
            />

            <a href="/dashboard" className="underline">
              Back to dashboard
            </a>
          </div>
        )}
      </div>
    </main>
  );
}