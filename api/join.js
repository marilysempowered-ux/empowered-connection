export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, email, segmentId, hearAbout } = req.body;

  const FLODESK_API_KEY = process.env.FLODESK_API_KEY;

  try {
    // Add subscriber
    const subResponse = await fetch('https://api.flodesk.com/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(FLODESK_API_KEY + ':').toString('base64')
      },
      body: JSON.stringify({
        first_name: firstName,
        email: email,
        custom_fields: { hear_about: hearAbout }
      })
    });

    // Add to segment
    await fetch(`https://api.flodesk.com/v1/subscribers/${email}/segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(FLODESK_API_KEY + ':').toString('base64')
      },
      body: JSON.stringify({ segment_ids: [segmentId] })
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}