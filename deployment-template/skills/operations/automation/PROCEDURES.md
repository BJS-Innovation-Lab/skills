# Automation Procedures

## Types of Automation

### Scheduled Tasks (Cron)
Use OpenClaw cron for:
- Daily/weekly reports
- Recurring reminders
- Periodic checks (inbox, calendar)
- Scheduled messages

```bash
# Example: Daily 9am reminder
cron add --schedule "0 9 * * *" --task "Check calendar and summarize today's events"
```

### Triggered Workflows
Use HEARTBEAT.md for:
- Periodic inbox checks
- Proactive suggestions
- Background monitoring

### Desktop Automation (mac-use)
Use for:
- GUI apps that don't have APIs
- Complex multi-app workflows
- Visual verification tasks

## Common Automations

### Morning Briefing (daily)
```
1. Check calendar - what's on today?
2. Check email - any urgent?
3. Check tasks - what's due?
4. Summarize to owner
```

### Weekly Review (weekly)
```
1. Summarize week's activities
2. Check overdue tasks
3. Review pipeline
4. Suggest priorities for next week
```

### Invoice Follow-Up (recurring)
```
1. Query CRM for overdue invoices
2. Draft polite follow-up
3. Send to owner for approval
4. Send and log
```

## Automation Best Practices

### Do Automate
- Repetitive manual tasks
- Scheduled reminders
- Data collection/reporting
- Follow-up sequences

### Don't Automate
- First-time tasks (do manually first)
- Sensitive communications
- Anything requiring judgment
- Complex exception handling

### Testing New Automations
1. Run manually first
2. Test with small batch
3. Add error handling
4. Monitor for a week
5. Adjust as needed

## Heartbeat Patterns

Add to HEARTBEAT.md for recurring checks:

```markdown
## Every Heartbeat
- [ ] Check inbox for urgent items
- [ ] Check calendar for upcoming (< 2h) meetings

## Daily (once per day)
- [ ] Summarize yesterday's activities
- [ ] Review today's calendar

## Weekly (once per week)  
- [ ] Pipeline review
- [ ] Overdue invoice check
```
