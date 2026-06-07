"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Design = {
  id: string;
  user_id: string;
  file_url: string;
  file_path: string;
  created_at: string;
};

export default function ProductPage() {
  const searchParams = useSearchParams();
  const designId = searchParams.get("designId");

  const [design, setDesign] = useState<Design | null>(null);
  const [productType, setProductType] = useState("t-shirt");
  const [size, setSize] = useState("L");
  const [color, setColor] = useState("Black");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDesign() {
      if (!designId) {
        setMessage("No design selected.");
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("id", designId)
        .eq("user_id", userData.user.id)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setDesign(data);
      setLoading(false);
    }

    loadDesign();
  }, [designId]);

  function handleContinue() {
    alert(
      `Selected: ${productType}, ${size}, ${color}`
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading product page...</p>
      </main>
    );
  }

  if (message) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4">
          <p>{message}</p>
          <a href="/designs" className="underline">
            Back to My Designs
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <section className="rounded border p-6">
          <h1 className="mb-4 text-3xl font-bold">
            Product Preview
          </h1>

          <div className="flex min-h-96 items-center justify-center rounded bg-gray-100 p-8">
            {design && (
              <div className="relative flex h-80 w-64 items-center justify-center rounded bg-black">
                <div className="absolute top-0 h-12 w-24 rounded-b-full bg-gray-100" />

                <img
                  src={design.file_url}
                  alt="Selected design"
                  className="max-h-44 max-w-44 object-contain"
                />
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded border p-6">
          <div>
            <h2 className="text-2xl font-bold">
              Choose Product
            </h2>
            <p className="text-sm text-gray-600">
              Select the product options for this design.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            Product Type
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="rounded border p-2"
            >
              <option value="t-shirt">T-Shirt</option>
              <option value="hoodie">Hoodie</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            Size
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="rounded border p-2"
            >
              <option value="S">Small</option>
              <option value="M">Medium</option>
              <option value="L">Large</option>
              <option value="XL">XL</option>
              <option value="2XL">2XL</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            Color
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="rounded border p-2"
            >
              <option value="Black">Black</option>
              <option value="White">White</option>
              <option value="Heather Gray">Heather Gray</option>
              <option value="Navy">Navy</option>
            </select>
          </label>

          <button
            onClick={handleContinue}
            className="rounded border p-3"
          >
            Continue
          </button>

          <a href="/designs" className="underline">
            Back to My Designs
          </a>
        </section>
      </div>
    </main>
  );
}