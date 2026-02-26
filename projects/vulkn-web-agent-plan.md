# VULKN Web Agent: "Vulki" (Powered by MiniMax M2.5)

## Objective
A 24/7 autonomous agent that lives on the VULKN landing page, handles incoming leads via WhatsApp/Web, explains pricing/skills, sends payment links, and books meetings.

## Architecture
1. **Engine:** MiniMax M2.5 (High-speed, low-cost API).
2. **Gateway:** OpenClaw running an isolated "Vulki" session.
3. **Knowledge Base:** 
   - VULKN Pricing Plan (Starter, Plus, Max, Ultra).
   - VULKN Skills Directory (53 skills verified).
   - Founders' Calendar availability (Bridget & Johan).
4. **Tools:**
   - `whatsapp_send`: Via Twilio API.
   - `calendar_book`: Via Google Calendar API.
   - `stripe_link`: Generate payment URLs (once sk_live is ready).

## Workflow
1. **Inbound:** User messages on WhatsApp or Web Widget.
2. **Analysis:** Vulki identifies the problem/industry.
3. **Response:** Vulki maps the problem to specific BJS/VULKN skills.
4. **Conversion:** Vulki offers a demo meeting or a direct payment link.
5. **Action:** Vulki books the Google Calendar event and sends confirmation.

## Next Steps for Sybil
1. Create `skills/minimax-engine/` to support the M2.5 API.
2. Create `skills/vulki-concierge/` for the specific persona and toolset.
3. Configure the webhook to funnel WhatsApp messages into this agent.
