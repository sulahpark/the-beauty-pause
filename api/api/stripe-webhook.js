// Vercel Serverless Function — Stripe webhook → records paid orders in Airtable
const Stripe = require("stripe");

// Vercel needs raw body for Stripe signature verification
module.exports.config = {
  api: { bodyParser: false },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const AT_BASE = process.env.REACT_APP_AIRTABLE_BASE;
      const AT_KEY = process.env.REACT_APP_AIRTABLE_KEY;
      const TBL_ORDERS = "tbl7EarBPyllxm1so";

      const fields = {
        order_id: session.id,
        product_name: session.metadata?.product_name || "",
        customer_email: session.customer_details?.email || session.customer_email || "",
        customer_name: session.customer_details?.name || "",
        amount: (session.amount_total || 0) / 100,
        status: "paid",
      };

      const atRes = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_ORDERS}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AT_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }] }),
      });

      if (!atRes.ok) {
        const errData = await atRes.json();
        console.error("Airtable order write failed:", errData);
      }
    } catch (err) {
      console.error("Error recording order:", err);
    }
  }

  return res.status(200).json({ received: true });
};
