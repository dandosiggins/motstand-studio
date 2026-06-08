import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId." },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        designs (
          file_url
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `${order.color} ${order.product_type} - ${order.size}`,
              images: order.designs?.file_url
                ? [order.designs.file_url]
                : [],
            },
            unit_amount: 2999,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
      },
      success_url: `${siteUrl}/success?orderId=${order.id}`,
      cancel_url: `${siteUrl}/checkout?orderId=${order.id}`,
    });

    await supabaseAdmin
      .from("orders")
      .update({
        stripe_payment_id: session.id,
        status: "checkout_started",
      })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 }
    );
  }
}