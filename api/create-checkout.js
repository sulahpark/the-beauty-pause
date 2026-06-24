// Vercel Serverless Function — creates a Stripe Checkout session for a product
const Stripe = require("stripe");

module.exports = async (req, res) => {
  // CORS (same-origin in production, but harmless to allow)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { productId, productName, brandName, priceEur, imageUrl } = req.body || {};

    const safeBrandName = typeof brandName === "string" ? brandName : (brandName ? String(brandName) : "");
    // only pass image if it's a valid http(s) URL — Stripe rejects malformed/non-public URLs
    const safeImageUrl = (typeof imageUrl === "string" && /^https?:\/\//.test(imageUrl)) ? imageUrl : undefined;

    if (!productId || !productName || !priceEur) {
      return res.status(400).json({ error: "Missing required fields: productId, productName, priceEur" });
    }

    const amountCents = Math.round(parseFloat(priceEur) * 100);
    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${safeBrandName ? safeBrandName + " — " : ""}${productName}`,
              images: safeImageUrl ? [safeImageUrl] : [],
              metadata: { product_id: String(productId) },
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_id: String(productId),
        product_name: String(productName),
        brand_name: safeBrandName,
      },
      success_url: `${origin}/products?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/products?order=cancelled`,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message || "Checkout creation failed", type: err.type || null });
  }
};
