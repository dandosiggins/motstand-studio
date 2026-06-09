import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGelatoProductUid } from "@/lib/gelato";

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

    if (!process.env.GELATO_API_KEY) {
      return NextResponse.json(
        { error: "Missing GELATO_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        designs (
          file_url,
          file_path
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

    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order must be paid before Gelato draft creation." },
        { status: 400 }
      );
    }

    if (!order.designs?.file_url) {
      return NextResponse.json(
        { error: "Order is missing design file URL." },
        { status: 400 }
      );
    }

    const requiredShippingFields = [
      "shipping_first_name",
      "shipping_last_name",
      "shipping_email",
      "shipping_address_line1",
      "shipping_city",
      "shipping_state",
      "shipping_post_code",
      "shipping_country",
    ];

    for (const field of requiredShippingFields) {
      if (!order[field]) {
        return NextResponse.json(
          { error: `Missing required shipping field: ${field}` },
          { status: 400 }
        );
      }
    }

    const productUid = getGelatoProductUid({
      productType: order.product_type,
      size: order.size,
      color: order.color,
    });

    const gelatoResponse = await fetch(
      "https://order.gelatoapis.com/v4/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.GELATO_API_KEY,
        },
        body: JSON.stringify({
          orderType: "draft",
          orderReferenceId: order.id,
          customerReferenceId: order.user_id,
          currency: "CAD",
          shippingAddress: {
            firstName: order.shipping_first_name,
            lastName: order.shipping_last_name,
            email: order.shipping_email,
            phone: order.shipping_phone || undefined,
            addressLine1: order.shipping_address_line1,
            addressLine2: order.shipping_address_line2 || undefined,
            city: order.shipping_city,
            state: order.shipping_state,
            postCode: order.shipping_post_code,
            country: order.shipping_country,
          },
          items: [
            {
              itemReferenceId: order.id,
              productUid,
              files: [
                {
                  type: "default",
                  url: order.designs.file_url,
                },
              ],
              quantity: 1,
            },
          ],
        }),
      }
    );

    const gelatoData = await gelatoResponse.json();

    if (!gelatoResponse.ok) {
      console.error("Gelato error:", gelatoData);

      return NextResponse.json(
        {
          error: "Gelato draft order creation failed.",
          details: gelatoData,
        },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("orders")
      .update({
        gelato_order_id: gelatoData.id ?? gelatoData.orderId ?? null,
        status: "gelato_draft_created",
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      gelato: gelatoData,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create Gelato draft order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}