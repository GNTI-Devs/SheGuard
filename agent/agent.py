import logging
import os
from livekit.agents import cli, AgentSession, JobContext, WorkerOptions, Agent
from livekit.plugins import google

# Load env variables from agent/.env since it's run from the project root
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

# Enable logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sheguard-agent")

SYSTEM_PROMPT = """
You are SheGuard AI, a warm, caring, and trusted maternal health companion for pregnant
women in Nigeria. You speak to women in their preferred language — English, Hausa, Yoruba,
Igbo, or Nigerian Pidgin — and you ALWAYS respond in the language the user has selected,
which is communicated to you via their participant attribute `language`.

Language codes and how to respond:
- `en`  → English
- `ha`  → Hausa (you can speak Hausa conversationally and simply)
- `yo`  → Yoruba (you can speak Yoruba conversationally and simply)
- `ig`  → Igbo (you can speak Igbo conversationally and simply)
- `pcm` → Nigerian Pidgin English (warm, natural Pidgin — e.g., "How you dey? No worry, I dey here for you.")

Your personality:
- Warm, gentle, and reassuring — like a trusted older sister or community health worker.
- Never clinical or cold. Never use intimidating medical jargon.
- Simple language always. If in doubt, use shorter sentences.
- You are patient. Women may be nervous, unsure, or speaking slowly.

Your core responsibilities:
1. DANGER SIGN DETECTION: Monitor for mentions of:
   - Severe headache
   - Swelling of face/hands/feet
   - Blurred vision
   - Bleeding or spotting
   - Fever or chills
   - Reduced or no baby movement
   - Severe abdominal pain
   - Convulsions
   If ANY of these are mentioned, immediately:
   a. Stay calm and reassure the user.
   b. Clearly explain this is a warning sign.
   c. Strongly advise seeking medical attention immediately.
   d. Set participant attribute `emergency_level` to `red` to trigger the app emergency UI.

2. PREGNANCY GUIDANCE: Offer trimester-appropriate advice on:
   - Nutrition and hydration
   - Antenatal visit importance
   - Fetal movement tracking
   - Rest and activity
   - Danger signs awareness

3. EMOTIONAL SUPPORT: Many users have fears, cultural beliefs, or past trauma.
   Acknowledge feelings before giving information. Never dismiss a concern.

4. APPOINTMENTS: Remind users of the importance of antenatal visits.
    Encourage them even if they've missed previous ones — it's never too late.
    If the user requests scheduling or reminding her of an upcoming antenatal visit, clinic checkup, scan, or appointment, use your `schedule_appointment` tool.

5. SYMPTOM LOGGING: If the user mentions experiencing symptoms during the conversation (such as morning sickness, headaches, fatigue, etc.), use the `log_symptoms` tool to register them in her journal.

6. HOSPITAL LOCATOR: If a user asks for nearby hospitals, clinics, or healthcare facilities in Lagos, Badagry, Kano, or anywhere in Nigeria, use your provider tools (like GoogleSearch or GoogleMaps) to locate real, active maternal care centers and describe them to the user.

Remember: You are not replacing a doctor. Always encourage professional medical care.
When in doubt: "Please see a health worker as soon as you can."

The user's preferred language is in their participant attribute: `language`.
Always check this and respond accordingly from the very first message.
"""

async def entrypoint(ctx: JobContext):
    logger.info(f"starting sheguard agent for room: {ctx.room.name}")
    
    # Resolve initial user language from participant attributes or metadata fallback
    user_lang = "en"
    user_participant = None
    
    for p in ctx.room.remote_participants.values():
        user_participant = p
        break
        
    if user_participant:
        lang = user_participant.attributes.get("language")
        if not lang and user_participant.metadata:
            try:
                import json
                meta = json.loads(user_participant.metadata)
                lang = meta.get("language")
            except Exception:
                pass
        if lang:
            user_lang = lang

    logger.info(f"Starting session with resolved user language: {user_lang}")
    
    # Append dynamic active language instruction
    dynamic_instructions = f"{SYSTEM_PROMPT}\n\nActive Language: {user_lang}. You MUST speak and respond ONLY in the language corresponding to '{user_lang}'."

    realtime_model = google.realtime.RealtimeModel(
        model="gemini-2.5-flash-native-audio-preview-12-2025", # Gemini Live API model
        voice="Aoede",                 # Warm female voice
        temperature=0.8,
        instructions=dynamic_instructions,
    )

    async def log_symptoms(symptoms: list[str]) -> str:
        """Log a list of pregnancy symptoms reported by the user (e.g. ['nausea', 'headache', 'swelling'])."""
        logger.info(f"AI Tool: Logging symptoms: {symptoms}")
        import json
        await ctx.room.local_participant.set_attributes({
            "log_symptoms": json.dumps(symptoms)
        })
        return f"Successfully logged symptoms: {symptoms}"

    async def schedule_appointment(title: str, date_time_str: str) -> str:
        """Schedule an upcoming medical checkup, scan, or prenatal visit. Parameter date_time_str should be ISO format (e.g. 2026-06-30T10:00:00Z)."""
        logger.info(f"AI Tool: Scheduling appointment '{title}' at {date_time_str}")
        import json
        await ctx.room.local_participant.set_attributes({
            "new_appointment": json.dumps({
                "title": title,
                "datetime": date_time_str
            })
        })
        return f"Successfully scheduled appointment: {title} at {date_time_str}"

    session = AgentSession(
        llm=realtime_model,
        tools=[
            google.tools.GoogleSearch(),
            google.tools.GoogleMaps(),
            log_symptoms,
            schedule_appointment
        ]
    )
    
    @ctx.room.on("participant_attributes_changed")
    def on_attributes_changed(changed_attributes, participant):
        # Triggered when client updates their preferred language dynamically
        if participant != ctx.room.local_participant:
            lang = participant.attributes.get("language")
            if lang:
                logger.info(f"User changed language attribute to: {lang}")

    @ctx.room.on("participant_metadata_changed")
    def on_metadata_changed(participant):
        if participant != ctx.room.local_participant:
            logger.info(f"User metadata changed: {participant.metadata}")

    agent = Agent(instructions=dynamic_instructions)
    await session.start(agent=agent, room=ctx.room)
    await ctx.connect()
    await session.generate_reply()
    logger.info("SheGuard AI agent session started successfully")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="sheguard-ai"
    ))
