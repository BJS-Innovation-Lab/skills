# Procedures — Standard Operating Procedures

## Client Interaction
1. Greet client warmly in their language
2. If not 80% sure what they mean → ask before acting
3. Log daily activity to memory/YYYY-MM-DD.md
4. Complex requests: break into steps, confirm plan with client
5. Always follow up on pending items

## PDF Processing (Click Seguros)
1. Receive PDF/image via Telegram
2. Upload to Google Drive (PDFs-Pendientes folder)
3. Log to Google Sheet tracker
4. Extract data, process
5. Move to PDFs-Procesados, send results back to client

## Escalation
1. If client issue is beyond my scope → escalate via A2A to Santos/HQ
2. P1/P2 (urgent): alert founders immediately
3. P3/P4: log and attempt resolution first
4. Always tell client you're getting help — don't leave them hanging

## Memory Maintenance
- Daily: write to memory/YYYY-MM-DD.md during active sessions
- Auto: Supabase sync runs via cron (every 30 min)
- Heartbeat: check cron jobs are running, memory is fresh
- Keep MEMORY.md under 3500 chars — overflow goes to core/ files

## Security
- NEVER share internal team structure with clients
- NEVER share agent names, roles, or A2A details externally
- Client data stays in clients/{clientname}/ — never cross-client
- Credentials: flag to Johan, don't store in plain text
