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

  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_post_code: string | null;
  shipping_country: string | null;

  designs: {
    file_url: string;
    file_path: string;
  } | null;
};

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shippingFirstName, setShippingFirstName] = useState("");
  const [shippingLastName, setShippingLastName] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddressLine1, setShippingAddressLine1] = useState("");
  const [shippingAddressLine2, setShippingAddressLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("AB");
  const [shippingPostCode, setShippingPostCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("CA");

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

      const loadedOrder = data as Order;
      setOrder(loadedOrder);

      setShippingFirstName(loadedOrder.shipping_first_name ?? "");
      setShippingLastName(loadedOrder.shipping_last_name ?? "");
      setShippingEmail(loadedOrder.shipping_email ?? userData.user.email ?? "");
      setShippingPhone(loadedOrder.shipping_phone ?? "");
      setShippingAddressLine1(loadedOrder.shipping_address_line1 ?? "");
      setShippingAddressLine2(loadedOrder.shipping_address_line2 ?? "");
      setShippingCity(loadedOrder.shipping_city ?? "");
      setShippingState(loadedOrder.shipping_state ?? "AB");
      setShippingPostCode(loadedOrder.shipping_post_code ?? "");
      setShippingCountry(loadedOrder.shipping_country ?? "CA");

      setLoading(false);
    }

    loadOrder();
  }, [orderId]);

  async function handleCheckout() {
    if (!order) {
      setMessage("No order found.");
      return;
    }

    if (
      !shippingFirstName ||
      !shippingLastName ||
      !shippingEmail ||
      !shippingAddressLine1 ||
      !shippingCity ||
      !shippingState ||
      !shippingPostCode ||
      !shippingCountry
    ) {
      setMessage("Please complete all required shipping fields.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        shipping_first_name: shippingFirstName,
        shipping_last_name: shippingLastName,
        shipping_email: shippingEmail,
        shipping_phone: shippingPhone,
        shipping_address_line1: shippingAddressLine1,
        shipping_address_line2: shippingAddressLine2,
        shipping_city: shippingCity,
        shipping_state: shippingState,
        shipping_post_code: shippingPostCode,
        shipping_country: shippingCountry,
      })
      .eq("id", order.id)
      .eq("user_id", order.user_id);

    if (updateError) {
      setSaving(false);
      setMessage(updateError.message);
      return;
    }

    const response = await fetch("/api/create-checkout-session", {
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
      setSaving(false);
      setMessage(data.error || "Unable to start checkout.");
      return;
    }

    window.location.href = data.url;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading checkout...</p>
      </main>
    );
  }

  if (message && !order) {
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

  if (!order) {
    return null;
  }

  const displayProduct =
    order.product_type === "t-shirt" ? "T-Shirt" : "Hoodie";

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
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

          <div className="mt-6 flex flex-col gap-3 rounded border p-4">
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

          <div className="mt-6 flex flex-col gap-2 rounded border p-4">
            <p className="text-lg font-bold">Estimated Price</p>
            <p className="text-3xl font-bold">$29.99</p>
            <p className="text-sm text-gray-600">
              Placeholder price for development.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded border p-6">
          <div>
            <h2 className="text-2xl font-bold">
              Shipping Information
            </h2>
            <p className="text-sm text-gray-600">
              Required before payment so Gelato can fulfill the order.
            </p>
          </div>

          {message && <p className="text-sm">{message}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              First Name *
              <input
                value={shippingFirstName}
                onChange={(e) => setShippingFirstName(e.target.value)}
                className="rounded border p-2"
              />
            </label>

            <label className="flex flex-col gap-2">
              Last Name *
              <input
                value={shippingLastName}
                onChange={(e) => setShippingLastName(e.target.value)}
                className="rounded border p-2"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            Email *
            <input
              type="email"
              value={shippingEmail}
              onChange={(e) => setShippingEmail(e.target.value)}
              className="rounded border p-2"
            />
          </label>

          <label className="flex flex-col gap-2">
            Phone
            <input
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              className="rounded border p-2"
            />
          </label>

          <label className="flex flex-col gap-2">
            Address Line 1 *
            <input
              value={shippingAddressLine1}
              onChange={(e) => setShippingAddressLine1(e.target.value)}
              className="rounded border p-2"
            />
          </label>

          <label className="flex flex-col gap-2">
            Address Line 2
            <input
              value={shippingAddressLine2}
              onChange={(e) => setShippingAddressLine2(e.target.value)}
              className="rounded border p-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2">
              City *
              <input
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="rounded border p-2"
              />
            </label>

            <label className="flex flex-col gap-2">
              Province/State *
              <input
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="rounded border p-2"
              />
            </label>

            <label className="flex flex-col gap-2">
              Postal Code *
              <input
                value={shippingPostCode}
                onChange={(e) => setShippingPostCode(e.target.value)}
                className="rounded border p-2"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            Country *
            <select
              value={shippingCountry}
              onChange={(e) => setShippingCountry(e.target.value)}
              className="rounded border p-2"
            >
              <option value="CA">Canada</option>
              <option value="US">United States</option>
            </select>
          </label>

          <button
            onClick={handleCheckout}
            disabled={saving}
            className="rounded border p-3 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Continue to Payment"}
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
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p>Loading checkout...</p>
        </main>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}