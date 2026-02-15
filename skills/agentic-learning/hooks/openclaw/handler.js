/**
 * Agentic Learning Hook for OpenClaw
 * 
 * Injects a learning evaluation reminder during agent bootstrap.
 * Updated for v2: three entry types, stakes gate, outcome loop.
 */

const REMINDER_CONTENT = `
## Agentic Learning — Active

After completing tasks, evaluate if extractable knowledge emerged:

**Three entry types (everything else → daily log):**

| Type | Trigger | Store To |
|------|---------|----------|
| **Correction** | Someone corrected you, or you realized you were wrong | \`memory/learning/corrections/\` (always stored) |
| **Insight** | Connected ideas in a new way, discovered a technique | \`memory/learning/insights/\` (stakes-gated) |
| **Outcome** | Past decision produced measurable results | \`memory/learning/outcomes/\` (always stored) |

**Before logging an insight, ask:** "What was at risk if I got this wrong?"
If you can't answer clearly → daily log, not the learning system.

**Config changes, tool calls, routine actions → daily log only.**

**Check for pending outcomes:** Any entries >3 days old without outcomes?
`.trim();

const handler = async (event) => {
  if (!event || typeof event !== 'object') return;
  if (event.type !== 'agent' || event.action !== 'bootstrap') return;
  if (!event.context || typeof event.context !== 'object') return;

  if (Array.isArray(event.context.bootstrapFiles)) {
    event.context.bootstrapFiles.push({
      path: 'AGENTIC_LEARNING_REMINDER.md',
      content: REMINDER_CONTENT,
      virtual: true,
    });
  }
};

module.exports = handler;
module.exports.default = handler;
