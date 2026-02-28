# Google Docs Writer Skill

This skill allows the agent to write and edit Google Docs using a service account.

## Setup
1. Ensure `googleapis` is installed: `npm install googleapis`
2. Ensure `~/.config/gog/vulkn-service-account.json` exists.

## Commands
- `write_to_doc(docId, text)`: Appends text to a Google Doc.
- `clear_doc(docId)`: Clears all content from a Google Doc.
