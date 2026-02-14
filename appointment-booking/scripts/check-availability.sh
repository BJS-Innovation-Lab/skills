#!/bin/bash
# Check calendar availability for a date range
# Usage: ./check-availability.sh [start_date] [end_date] [duration_minutes]
#
# Example: ./check-availability.sh 2026-02-14 2026-02-21 60

set -e

START_DATE="${1:-$(date +%Y-%m-%d)}"
END_DATE="${2:-$(date -v+7d +%Y-%m-%d)}"
DURATION="${3:-60}"

echo "Checking availability from $START_DATE to $END_DATE (${DURATION}min slots)"
echo "---"

# Get existing events
EVENTS=$(gog calendar events --from "$START_DATE" --to "$END_DATE" --json 2>/dev/null)

if [ -z "$EVENTS" ] || [ "$EVENTS" = "[]" ]; then
    echo "No existing events in this range."
else
    echo "Existing events:"
    echo "$EVENTS" | jq -r '.[] | "  • \(.start) - \(.end): \(.summary)"'
fi

echo ""
echo "Run 'gog calendar events' with --json to parse programmatically."
