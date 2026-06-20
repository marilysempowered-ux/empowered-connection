import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      line_items: [
        {
          price: 'price_1TjuilFw6D2MNIPCOF7t6ZeP',
          quantity: 1,
        },
      ],
      mode: 'payment',
      name_collection: {
        individual: { enabled: true, optional: false },
      },
      return_url: `${req.headers.origin}/orgasmic-body?session_id={CHECKOUT_SESSION_ID}`,
    });

    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return res.status(500).json({ error: 'Something went wrong creating checkout session' });
  }
}