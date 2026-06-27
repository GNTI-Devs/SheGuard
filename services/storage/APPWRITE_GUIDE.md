# SheGuard AI — Appwrite Database & Functions Setup Guide

This guide outlines how to replicate the production database structure and deploy the serverless LiveKit Token Generator inside Appwrite.

---

## 1. Appwrite Cloud Connection Details
The `AppwriteProvider.ts` in our codebase is pre-configured to communicate with the following endpoint:
* **API Endpoint**: `https://fra.cloud.appwrite.io/v1`
* **Project ID**: `68b412c200088ae94f6a`
* **Database ID**: `sheguard`

---

## 2. Database Schema (Collections & Attributes)

Create a Database with ID `sheguard` in your Appwrite Console, then set up the following 4 collections:

### Collection A: `profiles`
Stores user profile information.
* **Collection ID**: `profiles`
* **Attributes**:
  | Key | Type | Size / Limits | Required | Array |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | String | 255 | Yes | No |
  | `display_name` | String | 255 | Yes | No |
  | `language` | String | 10 | Yes | No |
  | `pregnancy_month` | Integer | Min: 0, Max: 12 | Yes | No |
  | `due_date` | String | 255 | Yes | No |
  | `is_demo` | Boolean | - | Yes | No |
  | `emergency_contacts` | String | 255 | No | **Yes** |
  | `created_at` | String | 255 | Yes | No |

---

### Collection B: `conversations`
Stores past audio check-in speech transcript logs.
* **Collection ID**: `conversations`
* **Attributes**:
  | Key | Type | Size / Limits | Required | Array |
  | :--- | :--- | :--- | :--- | :--- |
  | `conversation_id` | String | 255 | Yes | No |
  | `user_id` | String | 255 | Yes | No |
  | `room_name` | String | 255 | Yes | No |
  | `started_at` | String | 255 | Yes | No |
  | `ended_at` | String | 255 | No | No |
  | `had_emergency` | Boolean | - | Yes | No |
  | `messages_json` | String (LongText) | 10000 | No | No |

---

### Collection C: `appointments`
Stores upcoming clinic checkups and antenatal visits.
* **Collection ID**: `appointments`
* **Attributes**:
  | Key | Type | Size / Limits | Required | Array |
  | :--- | :--- | :--- | :--- | :--- |
  | `appointment_id` | String | 255 | Yes | No |
  | `user_id` | String | 255 | Yes | No |
  | `title` | String | 255 | Yes | No |
  | `datetime` | String | 255 | Yes | No |
  | `location` | String | 255 | No | No |
  | `completed` | Boolean | - | Yes | No |

---

### Collection D: `keyvalue`
Stores general app preferences and UI configuration states.
* **Collection ID**: `keyvalue`
* **Attributes**:
  | Key | Type | Size / Limits | Required | Array |
  | :--- | :--- | :--- | :--- | :--- |
  | `key_id` | String | 255 | Yes | No |
  | `user_id` | String | 255 | Yes | No |
  | `key_name` | String | 255 | Yes | No |
  | `value` | String (LongText) | 5000 | Yes | No |

> [!NOTE]
> Ensure permissions for all collections are set to allow `create`, `read`, `update`, and `delete` access to the role `users` in order for mobile clients to query their own documents.

---

## 3. Deployment of LiveKit Token Server Appwrite Function

To authenticate WebRTC rooms on SheGuard without leaking credentials, deploy an Appwrite Function:

### Step 1: Create a Function
In your Appwrite Console, navigate to **Functions** -> **Create Function** -> **Node.js** template. Give it the ID `generate-livekit-token`.

### Step 2: Configure Environment Variables
Inside the Function settings tab, add:
* `LIVEKIT_API_KEY`: *(Your LiveKit project key)*
* `LIVEKIT_API_SECRET`: *(Your LiveKit project secret)*

### Step 3: Implement Function Code (`src/main.js`)
Install dependency:
```bash
npm install livekit-server-sdk
```

Write the following serverless token generator code:
```javascript
import { AccessToken } from 'livekit-server-sdk';

export default async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.body || '{}');
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
      canUpdateOwnMetadata: true,
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
```

---

## 4. Swapping Active Storage Provider

To activate Appwrite database integration globally across the mobile application:
1. Open [StorageContext.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/services/storage/StorageContext.tsx) in the editor.
2. Modify the `activeProvider` variable:
   ```typescript
   // To activate Appwrite Database syncing:
   import { AppwriteProvider } from './providers/AppwriteProvider';
   const activeProvider: IStorageService = new AppwriteProvider();
   ```
3. Save the file. The rest of the app will instantly swap its storage sync logic to the Appwrite Cloud database with local offline fallback caches.
