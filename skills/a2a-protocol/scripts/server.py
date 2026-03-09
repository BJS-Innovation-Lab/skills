#!/usr/bin/env python3
"""
A2A Protocol Server - Receives direct messages from other agents
Usage: python3 server.py --port 8001 --agent-id <uuid>
"""

import argparse
import json
import os
import sys
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import urllib.request

# Configuration
SUPABASE_URL = os.environ.get('A2A_SUPABASE_URL', 'https://fcgiuzmmvcnovaciykbx.supabase.co')
SUPABASE_KEY = os.environ.get('A2A_SUPABASE_KEY', '')
AGENT_ID = os.environ.get('A2A_AGENT_ID', '')
AGENT_NAME = os.environ.get('A2A_AGENT_NAME', 'Unknown')

# In-memory message queue
messages = []

class A2AHandler(BaseHTTPRequestHandler):
    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        path = urlparse(self.path).path
        
        if path == '/health' or path == '/a2a/health':
            self._send_json(200, {
                'status': 'ok',
                'agent_id': AGENT_ID,
                'agent_name': AGENT_NAME,
                'timestamp': datetime.utcnow().isoformat()
            })
        
        elif path == '/card' or path == '/a2a/card':
            self._send_json(200, {
                'agent_id': AGENT_ID,
                'name': AGENT_NAME,
                'version': '1.0.0',
                'capabilities': ['messaging', 'tasks'],
                'hq_fallback': True
            })
        
        elif path == '/messages' or path == '/a2a/messages':
            self._send_json(200, {'messages': messages[-50:]})  # Last 50
        
        else:
            self._send_json(404, {'error': 'Not found'})
    
    def do_POST(self):
        path = urlparse(self.path).path
        
        if path == '/message' or path == '/a2a/message':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            
            try:
                msg = json.loads(body)
                msg['id'] = f"a2a-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
                msg['received_at'] = datetime.utcnow().isoformat()
                msg['delivery'] = 'direct'
                
                messages.append(msg)
                
                # Log to HQ for visibility
                self._log_to_hq(msg)
                
                print(f"📨 Received from {msg.get('from', '?')}: {msg.get('subject', 'No subject')}")
                
                self._send_json(200, {'id': msg['id'], 'status': 'received'})
            
            except json.JSONDecodeError:
                self._send_json(400, {'error': 'Invalid JSON'})
        else:
            self._send_json(404, {'error': 'Not found'})
    
    def _log_to_hq(self, msg):
        """Log message to HQ for audit trail"""
        if not SUPABASE_KEY:
            return
        
        try:
            data = json.dumps({
                'p_from_agent_id': msg.get('from'),
                'p_to_agent_id': AGENT_ID,
                'p_content': msg.get('content', {}),
                'p_message_type': msg.get('type', 'task'),
                'p_subject': f"[A2A] {msg.get('subject', '')}",
                'p_priority': msg.get('priority', 'normal')
            }).encode()
            
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/rpc/send_agent_message",
                data=data,
                headers={
                    'apikey': SUPABASE_KEY,
                    'Authorization': f'Bearer {SUPABASE_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception as e:
            print(f"⚠️ HQ log failed: {e}")
    
    def log_message(self, format, *args):
        pass  # Suppress default logging

def main():
    parser = argparse.ArgumentParser(description='A2A Protocol Server')
    parser.add_argument('--port', type=int, default=8001)
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--agent-id', default=AGENT_ID)
    parser.add_argument('--agent-name', default=AGENT_NAME)
    args = parser.parse_args()
    
    global AGENT_ID, AGENT_NAME
    AGENT_ID = args.agent_id or AGENT_ID
    AGENT_NAME = args.agent_name or AGENT_NAME
    
    if not AGENT_ID:
        print("Error: Set A2A_AGENT_ID environment variable or use --agent-id")
        sys.exit(1)
    
    server = HTTPServer((args.host, args.port), A2AHandler)
    print(f"🔗 A2A Server started")
    print(f"   Agent: {AGENT_NAME} ({AGENT_ID})")
    print(f"   Listening: http://{args.host}:{args.port}")
    print(f"   Endpoints: /a2a/message, /a2a/health, /a2a/card")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == '__main__':
    main()
