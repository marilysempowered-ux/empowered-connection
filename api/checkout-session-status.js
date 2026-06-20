import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FLODESK_API_KEY = process.env.FLODESK_API_KEY;
const ORGASMIC_BODY_SEGMENT_ID = '6a348d45010e2baa01fb3121';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(200).json({
        status: session.status,
        paid: false,
      });
    }

    const email = session.customer_details?.email;
    const name = session.customer_details?.name || '';
    const firstName = name.split(' ')[0] || '';

    if (email) {
      // Add subscriber to Flodesk
      await fetch('https://api.flodesk.com/v1/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(FLODESK_API_KEY + ':').toString('base64'),
        },
        body: JSON.stringify({
          first_name: firstName,
          email: email,
        }),
      });

      // Add to Orgasmic Body segment
      await fetch(`https://api.flodesk.com/v1/subscribers/${email}/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(FLODESK_API_KEY + ':').toString('base64'),
        },
        body: JSON.stringify({ segment_ids: [ORGASMIC_BODY_SEGMENT_ID] }),
      });
    }

    return res.status(200).json({
      status: session.status,
      paid: true,
      email: email,
    });
  } catch (error) {
    console.error('Checkout status / Flodesk error:', error);
    return res.status(500).json({ error: 'Something went wrong checking session status' });
  }
}
