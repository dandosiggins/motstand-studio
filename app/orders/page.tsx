"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setUser(userData.user);

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          designs (
            file_url,
            file_path
          )
        `)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-sm text-gray-600">
              Logged in as {user?.email}
            </p>
          </div>

          <a href="/designs" className="rounded border px-4 py-2">
            Create New Order
          </a>
        </div>

        {message && (
          <p className="rounded border p-3 text-sm">
            {message}
          </p>
        )}

        {orders.length === 0 ? (
          <div className="rounded border p-6">
            <p>You do not have any orders yet.</p>
            <a href="/designs" className="mt-4 inline-block underline">
              Start from one of your designs
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const displayProduct =
                order.product_type === "t-shirt" ? "T-Shirt" : "Hoodie";

              return (
                <div
                  key={order.id}
                  className="grid gap-6 rounded border p-4 md:grid-cols-[180px_1fr]"
                >
                  <div className="flex h-44 items-center justify-center rounded bg-gray-100 p-4">
                    {order.designs?.file_url ? (
                      <img
                        src={order.designs.file_url}
                        alt="Order design"
                        className="max-h-36 max-w-36 object-contain"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No image</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-bold">
                        {displayProduct} / {order.size} / {order.color}
                      </h2>

                      <span className="rounded border px-3 py-1 text-sm">
                        {order.status}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p>
                        <strong>Created:</strong>{" "}
                        {new Date(order.created_at).toLocaleString()}
                      </p>

                      <p className="break-all">
                        <strong>Order ID:</strong> {order.id}
                      </p>

                      <p className="break-all">
                        <strong>Stripe:</strong>{" "}
                        {order.stripe_payment_id || "Not started"}
                      </p>

                      <p className="break-all">
                        <strong>Gelato:</strong>{" "}
                        {order.gelato_order_id || "Not created"}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3">
                      <a
                        href={`/checkout?orderId=${order.id}`}
                        className="rounded border px-4 py-2"
                      >
                        View Checkout
                      </a>

                      <a
                        href={`/success?orderId=${order.id}`}
                        className="rounded border px-4 py-2"
                      >
                        View Success Page
                      </a>

                      <a
                        href={`/product?designId=${order.design_id}`}
                        className="rounded border px-4 py-2"
                      >
                        Reorder / Edit Product
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <a href="/dashboard" className="underline">
          Back to dashboard
        </a>
      </div>
    </main>
  );
}