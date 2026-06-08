"use client";

import { useEffect, useState } from "react";
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

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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

      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
        })
        .eq("id", orderId)
        .eq("user_id", userData.user.id)
        .select(`
          *,
          designs (
            file_url,
            file_path
          )
        `)
        .single();

      if (updateError) {
        setMessage(updateError.message);
        setOrder(existingOrder as Order);
        setLoading(false);
        return;
      }

      setOrder(updatedOrder as Order);
      setLoading(false);
    }

    loadAndUpdateOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Finalizing your order...</p>
      </main>
    );
  }

  if (message || !order) {
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
            </div>

            <p className="text-sm text-gray-600">
              Next, we’ll connect Gelato so paid orders can be sent for printing
              and fulfillment.
            </p>

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