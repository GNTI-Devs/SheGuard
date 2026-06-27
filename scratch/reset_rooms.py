import asyncio
import os
import sys

# Load env variables from agent/.env
env_path = os.path.join(os.path.dirname(__file__), "../agent/.env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

from livekit.api import LiveKitAPI, ListRoomsRequest, DeleteRoomRequest

async def main():
    url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    secret = os.getenv("LIVEKIT_API_SECRET")

    if not url or not api_key or not secret:
        print("Missing LiveKit environment variables in agent/.env")
        sys.exit(1)

    print(f"Connecting to LiveKit server: {url} using key: {api_key}")
    
    api = LiveKitAPI(url, api_key, secret)
    
    try:
        # List rooms
        rooms_res = await api.room.list_rooms(ListRoomsRequest())
        rooms = rooms_res.rooms
        print(f"Current active rooms ({len(rooms)}):")
        for r in rooms:
            print(f" - {r.name} (SID: {r.sid}, active participants: {r.num_participants})")
            
        # Delete sheguard-room
        print("Attempting to delete room 'sheguard-room'...")
        await api.room.delete_room(DeleteRoomRequest(room="sheguard-room"))
        print("Successfully deleted 'sheguard-room'. All connections closed.")
    except Exception as e:
        print(f"Error resetting room: {e}")
    finally:
        await api.aclose()

if __name__ == "__main__":
    asyncio.run(main())
