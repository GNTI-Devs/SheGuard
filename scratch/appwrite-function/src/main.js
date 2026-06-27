import { AccessToken } from 'livekit-server-sdk';

export default async ({ req, res, log, error }) => {
  try {
    let payload = {};
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body || '{}');
      } catch (e) {
        payload = {};
      }
    } else if (typeof req.body === 'object' && req.body !== null) {
      payload = req.body;
    }

    const roomName = payload.room || 'sheguard-room';
    const identity = payload.identity || 'test-user';
    const language = payload.language || 'en';

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Missing LiveKit environment variables on Appwrite Function.');
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: identity,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
    });

    token.metadata = JSON.stringify({
      language: language
    });

    const tokenJwt = await token.toJwt();
    return res.json({ token: tokenJwt });
  } catch (err) {
    error('Token generation failed: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
};
