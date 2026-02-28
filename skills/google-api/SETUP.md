# Google API Setup for Agents

All VULKN agents share access to scarlett@vulkn-ai.com's Google account.

## Setup (one-time per machine)

1. Get credentials from secure location (ask Bridget/Johan)
2. Place them at:
   ```
   ~/.config/gog/tokens.json
   ~/.config/gog/client_secret.json
   ~/.config/gog/token_expiry
   ```

3. Source the API wrapper:
   ```bash
   source ~/.openclaw/workspace/scripts/google-api.sh
   ```

4. Use it:
   ```bash
   google_api GET "https://docs.googleapis.com/v1/documents/DOC_ID"
   ```

## Token Refresh

Happens automatically when expired. Any agent can trigger refresh.
