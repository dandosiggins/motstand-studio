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

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
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

      const { data, error } = await supabase
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

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setOrder(data as Order);
      setLoading(false);
    }

    loadOrder();
  }, [orderId]);

  function handleCheckout() {
    alert("Stripe checkout will be added next.");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading checkout...</p>
      </main>
    );
  }

  if (message || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4">
          <p>{message || "Order not found."}</p>
          <a href="/designs" className="underline">
            Back to My Designs
          </a>
        </div>
      </main>
    );
  }

  const displayProduct =
    order.product_type === "t-shirt" ? "T-Shirt" : "Hoodie";

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <section className="rounded border p-6">
          <h1 className="mb-4 text-3xl font-bold">
            Checkout Summary
          </h1>

          <div className="flex min-h-96 items-center justify-center rounded bg-gray-100 p-8">
            <div className="relative flex h-80 w-64 items-center justify-center rounded bg-black">
              <div className="absolute top-0 h-12 w-24 rounded-b-full bg-gray-100" />

              {order.designs?.file_url && (
                <img
                  src={order.designs.file_url}
                  alt="Selected design"
                  className="max-h-44 max-w-44 object-contain"
                />
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded border p-6">
          <div>
            <h2 className="text-2xl font-bold">
              Your Order
            </h2>
            <p className="text-sm text-gray-600">
              Review your product before payment.
            </p>
          </div>

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
          </div>

          <div className="flex flex-col gap-2 rounded border p-4">
            <p className="text-lg font-bold">Estimated Price</p>
            <p className="text-3xl font-bold">$29.99</p>
            <p className="text-sm text-gray-600">
              Placeholder price for development.
            </p>
          </div>

          <button
            onClick={handleCheckout}
            className="rounded border p-3"
          >
            Continue to Payment
          </button>

          <a href={`/product?designId=${order.design_id}`} className="underline">
            Edit Product Options
          </a>

          <a href="/designs" className="underline">
            Back to My Designs
          </a>
        </section>
      </div>
    </main>
  );
}