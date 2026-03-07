# VibeKanban Deep Analysis for Frontier Lab

## Executive Summary

VibeKanban is a sophisticated local-only coding agent orchestrator that uses kanban-style task management to coordinate multiple AI coding agents (Claude Code, Cursor, etc.). They've built an impressive UX for the PLAN → PROMPT → REVIEW workflow with rich status tracking, real-time feedback, and seamless agent switching.

**Key Insight for Frontier Lab**: While VibeKanban runs local agents, their UI patterns and workflow orchestration are perfect for our distributed Railway agent architecture. Their status visualization, workspace management, and review flows can be adapted for remote webhook-based agents.

---

## Architecture Summary

### What They Built
- **Frontend**: React + TypeScript with drag-and-drop kanban boards
- **Backend**: Rust with SQLite database and WebSocket real-time updates  
- **Agent Interface**: Local executor discovery with MCP (Model Context Protocol)
- **Workflow**: Issue → Workspace → Agent Execution → Review → PR

### How It Works
1. **Planning**: Create issues on kanban board, set priorities/assignments
2. **Execution**: Spawn workspace (git branch + terminal + dev server)
3. **Agent Communication**: Execute coding agents with approval flows
4. **Review**: Built-in diff viewer with inline comments
5. **Deployment**: Create PRs with AI-generated descriptions

---

## Key Patterns We Should Adopt

### 1. UI/UX Patterns

#### **Rich Status Indicators**
Their `IssueWorkspaceCard` shows multiple status dimensions simultaneously:

```tsx
// Status indicators they use:
- RunningDots (actively executing)
- HandIcon (pending approval) 
- TriangleIcon (failed/error)
- PlayIcon (dev server running)
- CircleIcon (unseen activity)
```

**Adapt for Frontier Lab**: Show agent status (coding, reviewing, waiting), progress bars, and time indicators on each workstation.

#### **Drag-and-Drop Kanban**
Uses `@hello-pangea/dnd` with:
- Column headers with colored status dots
- Card drag between status columns  
- Mobile-responsive touch handling
- Keyboard navigation support

**Adapt for Frontier Lab**: Implement task movement between TODO → DOING → REVIEW → DONE with agent assignment.

#### **Workspace Chat Interface**
Their `WorkspacesMain` component provides:
- Conversation history with scroll management
- Context-aware chat input
- Floating action buttons
- Loading states with spinners

**Adapt for Frontier Lab**: Use for agent communication logs and human oversight.

#### **Modal/Drawer Patterns**
Consistent slide-out panels for:
- Agent details and actions
- Task configuration
- Settings and preferences

**Adapt for Frontier Lab**: Agent detail panels with logs, actions, and controls.

### 2. Data Model Patterns

#### **Core Entities**
```rust
Project {
  id, name, git_repo_path, setup_script, created_at, updated_at
}

Task {
  id, project_id, title, description, 
  status: 'todo' | 'inprogress' | 'inreview' | 'done' | 'cancelled',
  parent_workspace_id, created_at, updated_at
}

Workspace {
  id, task_id, container_ref, branch, name,
  archived, pinned, setup_completed_at,
  worktree_deleted, created_at, updated_at
}

ExecutionProcess {
  id, session_id, executor_action, status,
  run_reason: 'setupscript' | 'codingagent' | 'review',
  completed_at, created_at
}
```

#### **Status Tracking**
- Rich enum types for different states
- Timestamps for lifecycle events  
- Foreign key relationships maintaining data integrity
- Soft delete patterns (archived, worktree_deleted)

**Adapt for Frontier Lab**: Similar structure but with webhook-based execution tracking instead of local processes.

### 3. Agent Communication Patterns

#### **Action-Based Architecture**
```rust
enum ExecutorActionType {
  CodingAgentInitialRequest { prompt, base_executor },
  CodingAgentFollowUpRequest { prompt, base_executor },
  ReviewRequest { prompt, base_executor },
  ScriptRequest { command, args }
}

struct ExecutorAction {
  typ: ExecutorActionType,
  next_action: Option<Box<ExecutorAction>>
}
```

#### **Approval Workflows**
- Human-in-the-loop approval gates
- Status indicators for pending approvals
- Timeout handling for stalled processes

**Adapt for Frontier Lab**: Replace local executor spawning with Railway webhook calls, but keep the approval and chaining patterns.

### 4. Review Flow Patterns  

#### **Git Integration**
- Automatic branch creation per workspace
- Diff tracking with lines added/removed
- PR creation with AI-generated descriptions
- GitHub integration for final review

#### **Review Service**
- Separate service that processes PRs
- Narrative summary generation vs raw diffs
- Story-driven review highlights
- 14-day artifact retention policy

**Adapt for Frontier Lab**: Similar review orchestration but with distributed agents providing review inputs via webhooks.

---

## Key Differences for Our System

### VibeKanban (Local) vs Frontier Lab (Distributed)

| Aspect | VibeKanban | Frontier Lab |
|--------|------------|--------------|
| **Agent Location** | Local executables | Railway cloud instances |
| **Communication** | Direct process spawning | HTTP webhooks |
| **State Management** | SQLite local DB | Supabase distributed |
| **Real-time Updates** | WebSocket connections | Server-sent events |
| **Scaling** | Single machine limit | Horizontal cloud scaling |
| **Agent Types** | CLI tools (claude-code, cursor) | Custom webhook services |

### Architectural Adaptations Needed

1. **Webhook Orchestration**: Replace `ExecutorAction.spawn()` with HTTP webhook calls
2. **Distributed State**: Use Supabase instead of SQLite for multi-user access
3. **Async Processing**: Handle long-running agents with proper timeout/retry logic
4. **Load Balancing**: Route agent requests across available Railway instances
5. **Security**: Token-based auth for webhook endpoints vs local process trust

---

## Recommended Frontier Lab Spec

### Database Schema (Supabase)

```sql
-- Core entities adapted from VibeKanban
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  git_repo_url TEXT NOT NULL,
  setup_script TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo','doing','review','done','cancelled')) DEFAULT 'todo',
  assigned_agent_id UUID REFERENCES agents(id),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'coder', 'reviewer', 'qa_lead'
  webhook_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('idle','busy','error','offline')) DEFAULT 'idle',
  current_task_id UUID REFERENCES tasks(id),
  capabilities JSONB, -- supported languages, tools, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  webhook_payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending','running','completed','failed','cancelled')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('human','agent','system')) DEFAULT 'human',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

```typescript
// Agent Management
POST   /api/agents                    // Register new agent
GET    /api/agents                    // List all agents  
PUT    /api/agents/:id/status         // Update agent status
POST   /api/agents/:id/execute        // Send task to agent

// Task Orchestration  
GET    /api/projects/:id/tasks        // Get project kanban board
POST   /api/tasks                     // Create new task
PUT    /api/tasks/:id                 // Update task (status, assignment)
POST   /api/tasks/:id/assign          // Assign task to agent

// Real-time Updates
GET    /api/tasks/stream              // SSE for task status updates
GET    /api/agents/stream             // SSE for agent status updates

// Webhook Endpoints (for agents to call back)
POST   /webhook/agent/:id/status      // Agent reports status change
POST   /webhook/agent/:id/result      // Agent reports task completion
POST   /webhook/agent/:id/approval    // Agent requests human approval
```

### React Components

```typescript
// Main orchestration view
<FrontierLab>
  <AgentWorkstations agents={agents} onAgentClick={showAgentDetails} />
  <TaskKanban tasks={tasks} onTaskMove={updateTaskStatus} />
  <AgentDetailsDrawer agent={selectedAgent} onClose={closeDetails} />
</FrontierLab>

// Enhanced workstation display
<AgentWorkstation agent={agent}>
  <TaskProgressCard task={agent.currentTask} />
  <StatusMonitor status={agent.status} />
  <ActivityFeed activities={agent.recentActivities} />
</AgentWorkstation>

// Kanban board with agent context
<KanbanBoard>
  <KanbanColumn status="todo" onDrop={assignTask} />
  <KanbanColumn status="doing" agents={busyAgents} />
  <KanbanColumn status="review" reviewer={qaLead} />
  <KanbanColumn status="done" onDrop={markComplete} />
</KanbanBoard>
```

---

## Implementation Priority List

### Phase 1: Core Infrastructure (Week 1-2)
1. **Database Setup**: Create Supabase schema with core tables
2. **Agent Registration**: API for agents to register and report status
3. **Basic UI**: Simple kanban board with drag-and-drop
4. **Webhook Framework**: Accept and process agent webhook calls

### Phase 2: Agent Orchestration (Week 3-4)  
1. **Task Assignment**: Assign tasks to agents via webhook calls
2. **Status Tracking**: Real-time updates on agent and task progress
3. **Agent Workstations**: Visual display of agent status and current tasks
4. **Error Handling**: Timeout, retry, and failure recovery logic

### Phase 3: Enhanced UX (Week 5-6)
1. **Rich Status Indicators**: Implement VibeKanban-style status visualization
2. **Agent Details Panel**: Detailed view with logs, actions, controls
3. **Progress Tracking**: Time estimates, progress bars, activity feeds
4. **Mobile Responsive**: Touch-friendly interface for tablet/mobile

### Phase 4: Advanced Features (Week 7-8)
1. **Approval Workflows**: Human-in-the-loop gates for critical decisions
2. **QA Lead Role**: Special agent type for coordinating reviews
3. **Chat Interface**: Agent communication logs and human interaction
4. **Analytics**: Performance metrics, success rates, bottleneck detection

### Phase 5: Polish & Deploy (Week 9-10)
1. **Performance Optimization**: Efficient real-time updates, caching
2. **Security Hardening**: Webhook auth, rate limiting, input validation
3. **Documentation**: API docs, agent integration guides
4. **Production Deployment**: Railway deployment with monitoring

---

## Next Steps

1. **Prototype Validation**: Build minimal working version with one agent type
2. **Agent Interface Design**: Define webhook protocol and payload schemas  
3. **Real-time Architecture**: Choose between WebSockets vs Server-Sent Events
4. **UI Component Library**: Create reusable components based on VibeKanban patterns
5. **Testing Strategy**: Plan for distributed system testing and agent simulation

The VibeKanban analysis provides an excellent foundation for our distributed agent orchestration system. Their proven UX patterns, combined with our cloud-native architecture, should deliver a powerful and intuitive experience for managing distributed AI agent workflows.