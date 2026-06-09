export function getGelatoProductUid({
  productType,
  size,
  color,
}: {
  productType: string;
  size: string;
  color: string;
}) {
  const normalizedColor = color.toLowerCase();

  if (productType === "t-shirt") {
    if (normalizedColor === "black") {
      return mapBlackTShirtSize(size);
    }

    if (normalizedColor === "white") {
      return mapWhiteTShirtSize(size);
    }
  }

  throw new Error(
    `No Gelato product UID configured for ${productType}, ${size}, ${color}`
  );
}

function mapBlackTShirtSize(size: string) {
  const map: Record<string, string> = {
    S: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_s_gco_black_gpr_4-4",
    M: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_m_gco_black_gpr_4-4",
    L: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_l_gco_black_gpr_4-4",
    XL: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_xl_gco_black_gpr_4-4",
    "2XL": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_2xl_gco_black_gpr_4-4",
  };

  if (!map[size]) {
    throw new Error(`Unsupported black t-shirt size: ${size}`);
  }

  return map[size];
}

function mapWhiteTShirtSize(size: string) {
  const map: Record<string, string> = {
    S: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_s_gco_white_gpr_4-4",
    M: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_m_gco_white_gpr_4-4",
    L: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_l_gco_white_gpr_4-4",
    XL: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_xl_gco_white_gpr_4-4",
    "2XL": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_2xl_gco_white_gpr_4-4",
  };

  if (!map[size]) {
    throw new Error(`Unsupported white t-shirt size: ${size}`);
  }

  return map[size];
}