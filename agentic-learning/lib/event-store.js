/**
 * Event Store - Append-only event logging
 * 
 * All events use a unified schema and are appended to events.jsonl
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EventStore {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.eventsFile = path.join(learningDir, 'events', 'events.jsonl');
    this.statusFile = path.join(learningDir, 'status.json');
  }

  /**
   * Generate unique event ID
   */
  generateId(type) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const random = crypto.randomBytes(4).toString('hex');
    return `evt_${type}_${timestamp}_${random}`;
  }

  /**
   * Append event to log
   * 
   * @param {Object} event - Event data
   * @param {string} event.type - Event type: decision|error|learning|pattern|procedure|goal|evolution
   * @param {string} event.action - Specific action within type
   * @param {Object} event.data - Type-specific data
   * @param {Object} event.context - Context information
   */
  async append(event) {
    const fullEvent = {
      id: this.generateId(event.type),
      timestamp: new Date().toISOString(),
      type: event.type,
      action: event.action || null,
      source: event.source || 'session',
      session_key: event.session_key || null,
      context: event.context || {},
      data: event.data || {},
      outcome: event.outcome || { status: 'pending' },
      linked_events: event.linked_events || {}
    };

    // Append to JSONL file
    const line = JSON.stringify(fullEvent) + '\n';
    fs.appendFileSync(this.eventsFile, line);

    // Update status metrics
    this.incrementMetric('events_logged');

    return fullEvent;
  }

  /**
   * Update event outcome
   */
  async updateOutcome(eventId, outcome) {
    // Read all events
    const content = fs.readFileSync(this.eventsFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    
    // Find and update event
    const updated = lines.map(line => {
      const event = JSON.parse(line);
      if (event.id === eventId) {
        event.outcome = { ...event.outcome, ...outcome };
        event.updated_at = new Date().toISOString();
      }
      return JSON.stringify(event);
    });

    // Write back
    fs.writeFileSync(this.eventsFile, updated.join('\n') + '\n');
  }

  /**
   * Link events together
   */
  async linkEvents(eventId, links) {
    const content = fs.readFileSync(this.eventsFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    
    const updated = lines.map(line => {
      const event = JSON.parse(line);
      if (event.id === eventId) {
        event.linked_events = { ...event.linked_events, ...links };
      }
      return JSON.stringify(event);
    });

    fs.writeFileSync(this.eventsFile, updated.join('\n') + '\n');
  }

  /**
   * Query events
   */
  async query(filters = {}) {
    if (!fs.existsSync(this.eventsFile)) return [];
    
    const content = fs.readFileSync(this.eventsFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    
    let events = lines.map(line => JSON.parse(line));

    // Apply filters
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    if (filters.action) {
      events = events.filter(e => e.action === filters.action);
    }
    if (filters.since) {
      const since = new Date(filters.since);
      events = events.filter(e => new Date(e.timestamp) >= since);
    }
    if (filters.limit) {
      events = events.slice(-filters.limit);
    }

    return events;
  }

  /**
   * Get recent events of type
   */
  async getRecent(type, limit = 10) {
    return this.query({ type, limit });
  }

  /**
   * Increment status metric
   */
  incrementMetric(metric) {
    try {
      const status = JSON.parse(fs.readFileSync(this.statusFile, 'utf-8'));
      status.metrics[metric] = (status.metrics[metric] || 0) + 1;
      status.last_updated = new Date().toISOString();
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
    } catch (e) {
      // Ignore errors
    }
  }
}

module.exports = { EventStore };
