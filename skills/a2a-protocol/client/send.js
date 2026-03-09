#!/usr/bin/env node
/**
 * A2A Relay Client - Send a message
 * Usage: node send.js --from <id> --to <id> --content '{"msg":"hello"}' [--type task] [--priority normal]
 */

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const FROM = getArg('from') || process.env.A2A_AGENT_ID;
const TO = getArg('to');
const CONTENT = getArg('content');
const TYPE = getArg('type') || 'task';
const SUBJECT = getArg('subject');
const PRIORITY = getArg('priority') || 'normal';
const RELAY_URL = getArg('relay-url') || process.env.A2A_RELAY_URL || 'http://localhost:3000';

if (!FROM || !TO || !CONTENT) {
  console.error('Usage: node send.js --from <id> --to <id> --content \'{"msg":"hello"}\' [--type task] [--priority normal]');
  console.error('\nRequired:');
  console.error('  --from      Sender agent ID (or set A2A_AGENT_ID)');
  console.error('  --to        Recipient agent ID');
  console.error('  --content   JSON content');
  console.error('\nOptional:');
  console.error('  --type      task|response|notification|query (default: task)');
  console.error('  --subject   Message subject');
  console.error('  --priority  low|normal|high|urgent (default: normal)');
  console.error('  --relay-url Relay server URL (or set A2A_RELAY_URL)');
  process.exit(1);
}

let content;
try {
  content = JSON.parse(CONTENT);
} catch {
  content = { message: CONTENT };
}

const payload = {
  from: FROM,
  to: TO,
  content,
  type: TYPE,
  priority: PRIORITY
};
if (SUBJECT) payload.subject = SUBJECT;

fetch(`${RELAY_URL}/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Error:', data.error);
      process.exit(1);
    }
    const status = data.delivered ? '✅ Delivered' : '📥 Queued';
    console.log(`${status} - Message ID: ${data.messageId}`);
  })
  .catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
