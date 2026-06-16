"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  user_id: string;
  design_id: string;
  product_type: string;
  size: string;
  color: string;
  status: string;
  stripe_payment_id: string | null;
  gelato_order_id: string | null;
  created_at: string;
  designs: {
    file_url: string;
    file_path: string;
  } | null;
};

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingGelatoDraft, setCreatingGelatoDraft] = useState(false);

  useEffect(() => {
    async function loadAndUpdateOrder() {
      if (!orderId) {
        setMessage("No order selected.");
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: existingOrder, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          designs (
            file_url,
            file_path
          )
        `)
        .eq("id", orderId)
        .eq("user_id", userData.user.id)
        .single();

      if (fetchError || !existingOrder) {
        setMessage(fetchError?.message || "Order not found.");
        setLoading(false);
        return;
      }

setOrder(existingOrder as Order);
setLoading(false);
    }

    loadAndUpdateOrder();
  }, [orderId]);

  async function handleCreateGelatoDraft() {
    if (!order) {
      setMessage("No order found.");
      return;
    }

    setCreatingGelatoDraft(true);
    setMessage("");

    const response = await fetch("/api/create-gelato-draft-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: order.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setCreatingGelatoDraft(false);

      console.error("Gelato draft error:", data);

      setMessage(
        data.error ||
          "Unable to create Gelato draft order. Check the browser console and terminal for details."
      );

      return;
    }

    setCreatingGelatoDraft(false);
    window.location.reload();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Finalizing your order...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex max-w-md flex-col gap-4 rounded border p-6">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p>{message || "Order not found."}</p>

          <a href="/dashboard" className="underline">
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  const displayProduct =
    order.product_type === "t-shirt" ? "T-Shirt" : "Hoodie";

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <section className="rounded border p-6">
          <h1 className="text-3xl font-bold">Payment Successful</h1>
          <p className="mt-2 text-gray-600">
            Your order has been marked as paid.
          </p>

          {message && (
            <p className="mt-4 rounded border p-3 text-sm">
              {message}
            </p>
          )}
        </section>

        <section className="grid gap-8 rounded border p-6 md:grid-cols-2">
          <div className="flex min-h-80 items-center justify-center rounded bg-gray-100 p-8">
            <div className="relative flex h-72 w-56 items-center justify-center rounded bg-black">
              <div className="absolute top-0 h-10 w-20 rounded-b-full bg-gray-100" />

              {order.designs?.file_url && (
                <img
                  src={order.designs.file_url}
                  alt="Selected design"
                  className="max-h-40 max-w-40 object-contain"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Order Details</h2>

            <div className="flex flex-col gap-3 rounded border p-4">
              <p>
                <strong>Product:</strong> {displayProduct}
              </p>
              <p>
                <strong>Size:</strong> {order.size}
              </p>
              <p>
                <strong>Color:</strong> {order.color}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
              <p className="break-all text-sm text-gray-600">
                <strong>Order ID:</strong> {order.id}
              </p>
              {order.gelato_order_id && (
                <p className="break-all text-sm text-gray-600">
                  <strong>Gelato Order ID:</strong> {order.gelato_order_id}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-600">
              This creates a draft order in Gelato so we can confirm the
              fulfillment connection safely before enabling live production
              orders.
            </p>

            <button
  onClick={handleCreateGelatoDraft}
  disabled={
    creatingGelatoDraft ||
    order.status === "gelato_draft_created" ||
    order.status !== "paid"
  }
  className="rounded border p-3 text-center disabled:opacity-50"
>
              {order.status === "gelato_draft_created"
  ? "Gelato Draft Created"
  : order.status !== "paid"
    ? "Waiting for Stripe Payment Confirmation"
    : creatingGelatoDraft
      ? "Creating Gelato Draft..."
      : "Create Gelato Draft Order"}
            </button>

            <a href="/dashboard" className="rounded border p-3 text-center">
              Back to Dashboard
            </a>

            <a href="/designs" className="underline">
              Create another order
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p>Loading success page...</p>
        </main>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}