import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk';

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
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error(
        'Missing LiveKit environment variables on Appwrite Function.'
      );
    }

    // 1. Generate the participant JWT token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: identity,
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canUpdateOwnMetadata: true,
    });
    token.metadata = JSON.stringify({ language });
    const tokenJwt = await token.toJwt();

    // 2. Dispatch the SheGuard AI agent to the room automatically.
    try {
      const agentClient = new AgentDispatchClient(livekitUrl, apiKey, apiSecret);
      await agentClient.createDispatch(roomName, 'sheguard-ai', {
        metadata: JSON.stringify({ language }),
      });
      log(`Agent dispatched to room: ${roomName}`);
    } catch (dispatchErr: any) {
      error('Agent dispatch warning (non-fatal): ' + dispatchErr.message);
    }

    return res.json({ token: tokenJwt });
  } catch (err: any) {
    error('Token generation failed: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
};
