# VULKN AI Agent Platform - Knowledge Graph Ontology v1.0

**Last Updated:** 2026-02-17  
**Purpose:** Enable cross-client pattern discovery, research insights, and deep relationship analysis for VULKN's $35K MXN/month AI agent deployments.

## 1. Core Entities (Nodes)

### 1.1 People & Organizations

**Agent** - AI agents deployed to clients
- `id`: unique identifier
- `name`: agent name (Sam, Sybil, Saber, Santos, Sage)
- `emoji`: visual identifier (🛠️, 🧠, 💼, 🏢, 👑)
- `role`: primary function (field, ML/research, sales/marketing, COO, lead)
- `status`: active, down, maintenance
- `deployment_date`: when agent went live
- `personality_traits`: JSON array of traits
- `capabilities`: JSON array of skills
- `version`: current agent version

**Client** - SMB organizations using VULKN services
- `id`: unique identifier  
- `name`: company name (Click Seguros, Senda Chat)
- `industry`: business sector
- `size`: employee count range
- `contract_value`: monthly fee (35000 MXN)
- `start_date`: service start
- `status`: active, churned, paused
- `location`: geographic location
- `timezone`: operational timezone

**Person** - Humans in the system (client team members, VULKN staff)
- `id`: unique identifier
- `name`: full name (Javier Mitrani, Suzanne Rubinstein)
- `role`: job title/function (CEO, team member)
- `email`: contact email
- `persona_type`: behavioral classification
- `activity_level`: engagement frequency
- `preferred_communication`: channel preferences

**Founder** - VULKN company founders
- `id`: unique identifier
- `name`: founder name (Bridget, Johan)
- `role`: company function
- `equity_percentage`: ownership stake

### 1.2 Interactions & Content

**Conversation** - Communication sessions
- `id`: unique identifier
- `start_time`: conversation start
- `end_time`: conversation end
- `channel`: platform (telegram, slack, email, web)
- `message_count`: total messages
- `sentiment_score`: overall tone (-1 to 1)
- `resolution_status`: resolved, ongoing, escalated
- `topic_tags`: JSON array of topics discussed
- `language`: primary language used

**Message** - Individual communications
- `id`: unique identifier
- `timestamp`: message time
- `content`: message text
- `message_type`: text, image, file, system
- `direction`: inbound, outbound
- `confidence_score`: agent confidence in response
- `processing_time`: time to generate response

**Decision** - Agent choices and actions
- `id`: unique identifier
- `timestamp`: when decision made
- `decision_type`: feature_request, bug_fix, escalation, recommendation
- `context`: surrounding circumstances
- `reasoning`: agent's rationale
- `confidence_level`: certainty (0-1)
- `outcome`: result of decision
- `stakeholder_approval`: required approval status

### 1.3 Work Items & Outcomes

**Feature** - New capabilities or enhancements
- `id`: unique identifier
- `name`: feature name/title
- `description`: detailed specification
- `priority`: high, medium, low
- `status`: requested, in_progress, completed, rejected
- `complexity_score`: development effort (1-10)
- `business_impact`: expected value
- `completion_date`: when delivered
- `client_satisfaction`: post-delivery feedback

**Bug** - Issues and problems
- `id`: unique identifier
- `title`: bug summary
- `description`: detailed description
- `severity`: critical, high, medium, low
- `status`: open, in_progress, resolved, closed
- `discovery_method`: how found (client_report, agent_detected, testing)
- `resolution_time`: time to fix
- `root_cause`: underlying issue
- `recurrence_count`: times this bug type occurred

**Outcome** - Results and impacts
- `id`: unique identifier
- `outcome_type`: business_metric, satisfaction, technical_metric
- `metric_name`: specific measurement
- `value`: numerical result
- `measurement_date`: when measured
- `baseline_value`: comparison point
- `trend_direction`: improving, declining, stable
- `attribution_confidence`: how certain this outcome relates to agent actions

### 1.4 Knowledge & Learning

**Learning_Entry** - Insights and knowledge captured
- `id`: unique identifier
- `timestamp`: when learned
- `learning_type`: pattern, insight, correction, best_practice
- `content`: learning description
- `confidence_level`: certainty in learning (0-1)
- `generalizability`: client-specific or universal
- `source_type`: conversation, outcome, analysis
- `validation_status`: hypothesis, validated, disproven

**Pattern** - Discovered trends across clients
- `id`: unique identifier
- `pattern_name`: descriptive name
- `description`: pattern details
- `frequency`: how often observed
- `client_count`: number of clients showing pattern
- `statistical_significance`: confidence in pattern
- `discovery_date`: when first identified
- `business_implications`: strategic insights
- `recommended_actions`: suggested responses

**Incident** - Notable events or problems
- `id`: unique identifier
- `timestamp`: when incident occurred
- `incident_type`: security, performance, behavior, identity_crisis
- `severity`: critical, high, medium, low
- `description`: what happened
- `affected_entities`: who/what was impacted
- `resolution_time`: time to resolve
- `lessons_learned`: insights gained
- `prevention_measures`: steps to avoid recurrence

### 1.5 Meta Entities

**Document** - Files and artifacts
- `id`: unique identifier
- `title`: document name
- `content_type`: contract, report, specification, log
- `file_path`: storage location
- `created_date`: creation time
- `last_modified`: last update
- `access_level`: public, client, internal, restricted
- `version`: document version

**Query** - Research questions and investigations
- `id`: unique identifier
- `question`: research question asked
- `query_type`: operational, strategic, technical
- `timestamp`: when asked
- `complexity`: analysis depth required
- `results_summary`: findings summary
- `confidence_level`: certainty in results

## 2. Relationships (Edges)

### 2.1 Assignment & Ownership

- **SERVES** (Agent → Client): Sam SERVES Click_Seguros
  - `start_date`: when assignment began
  - `status`: active, paused, ended
  - `performance_rating`: client satisfaction score

- **WORKS_FOR** (Person → Client): Javier WORKS_FOR Click_Seguros
  - `role`: job title
  - `start_date`: employment start
  - `authority_level`: decision-making power

- **FOUNDED** (Founder → Client): Bridget FOUNDED VULKN
  - `founding_date`: when founded
  - `initial_role`: starting position

### 2.2 Communication & Interaction

- **PARTICIPATES_IN** (Person/Agent → Conversation): Sam PARTICIPATES_IN conv_123
  - `role`: initiator, responder, observer
  - `message_count`: messages sent
  - `engagement_level`: active, passive

- **SENT** (Person/Agent → Message): Suzanne SENT msg_456
  - `timestamp`: when sent
  - `channel`: communication method

- **PART_OF** (Message → Conversation): msg_456 PART_OF conv_123
  - `sequence_number`: order in conversation
  - `response_to`: which message this responds to

### 2.3 Work & Outcomes

- **MADE** (Agent → Decision): Sam MADE decision_789
  - `confidence`: agent's certainty
  - `context_factors`: influencing factors

- **TRIGGERED** (Conversation → Decision): conv_123 TRIGGERED decision_789
  - `relevance_score`: how directly it influenced

- **REQUESTED** (Person → Feature): Javier REQUESTED feature_101
  - `urgency`: how quickly needed
  - `business_justification`: why important

- **IMPLEMENTED** (Agent → Feature): Sam IMPLEMENTED feature_101
  - `development_time`: hours spent
  - `complexity_encountered`: challenges faced

- **DISCOVERED** (Agent/Person → Bug): Sam DISCOVERED bug_202
  - `discovery_method`: how found
  - `initial_severity_assessment`: first impression

- **RESOLVED** (Agent → Bug): Sam RESOLVED bug_202
  - `resolution_time`: time to fix
  - `resolution_method`: how fixed

- **LED_TO** (Decision/Feature/Bug → Outcome): decision_789 LED_TO outcome_303
  - `causal_strength`: confidence in causation (0-1)
  - `time_delay`: lag between cause and effect

### 2.4 Learning & Knowledge

- **LEARNED_FROM** (Agent → Conversation/Outcome/Incident): Sam LEARNED_FROM conv_123
  - `learning_type`: pattern, correction, insight
  - `confidence`: certainty in learning

- **CREATED** (Agent/Analysis → Pattern): research_query CREATED pattern_404
  - `discovery_method`: how pattern found
  - `validation_level`: confidence in pattern

- **EXHIBITS** (Client → Pattern): Click_Seguros EXHIBITS pattern_404
  - `strength`: how strongly pattern shows (0-1)
  - `first_observed`: when first seen

- **INVOLVED_IN** (Agent/Client/Person → Incident): Sam INVOLVED_IN incident_505
  - `role`: victim, cause, resolver, observer
  - `impact_level`: how affected

### 2.5 Meta Relationships

- **MENTIONED_IN** (Entity → Document): Sam MENTIONED_IN doc_606
  - `context`: how mentioned
  - `sentiment`: positive, negative, neutral

- **ANSWERS** (Query → Pattern/Outcome): query_707 ANSWERS pattern_404
  - `relevance_score`: how well it answers (0-1)
  - `completeness`: partial, complete

## 3. Example Queries (Graph Advantages)

### 3.1 Cross-Client Pattern Discovery

```cypher
// Query 1: Find onboarding friction patterns across clients
MATCH (c:Client)-[:EXHIBITS]->(p:Pattern {pattern_name: "onboarding_friction"})
MATCH (p)<-[:LED_TO]-(d:Decision)<-[:TRIGGERED]-(conv:Conversation)
MATCH (conv)<-[:PARTICIPATES_IN]-(person:Person)-[:WORKS_FOR]->(c)
WHERE p.frequency > 0.6
RETURN c.name, count(d) as friction_decisions, collect(person.name) as affected_people
```

```cypher
// Query 2: What do clients typically need after 6 months?
MATCH (c:Client)-[:SERVES]-(a:Agent)-[:REQUESTED]->(f:Feature)
WHERE duration.between(c.start_date, f.completion_date).months >= 6 
  AND duration.between(c.start_date, f.completion_date).months <= 8
MATCH (f)-[:LED_TO]->(o:Outcome)
WHERE o.trend_direction = "improving"
RETURN f.name, count(c) as client_count, avg(o.value) as avg_impact
ORDER BY client_count DESC
```

### 3.2 Agent Performance & Learning

```cypher
// Query 3: Which agents learn fastest from incidents?
MATCH (a:Agent)-[:INVOLVED_IN]->(i:Incident)
MATCH (a)-[:LEARNED_FROM]->(i)
MATCH (a)-[:LEARNED_FROM]->(le:Learning_Entry)
WHERE le.timestamp > i.timestamp
  AND duration.between(i.timestamp, le.timestamp).days <= 7
RETURN a.name, count(DISTINCT i) as incidents, 
       count(DISTINCT le) as learnings,
       count(DISTINCT le)*1.0/count(DISTINCT i) as learning_rate
ORDER BY learning_rate DESC
```

```cypher
// Query 4: Find decision chains that led to successful outcomes
MATCH path = (conv:Conversation)-[:TRIGGERED]->(d1:Decision)-[:LED_TO*1..3]->(d2:Decision)
MATCH (d2)-[:LED_TO]->(o:Outcome)
WHERE o.value > o.baseline_value * 1.2
RETURN path, o.metric_name, o.value
ORDER BY length(path) DESC
```

### 3.3 Client Relationship Analysis

```cypher
// Query 5: Find clients with similar team dynamics
MATCH (c1:Client)<-[:WORKS_FOR]-(p1:Person)-[:PARTICIPATES_IN]->(conv:Conversation)
MATCH (c2:Client)<-[:WORKS_FOR]-(p2:Person)-[:PARTICIPATES_IN]->(conv2:Conversation)
WHERE c1 <> c2
MATCH (conv)-[:PART_OF]->(m1:Message), (conv2)-[:PART_OF]->(m2:Message)
WITH c1, c2, avg(m1.sentiment_score) as avg_sentiment1, avg(m2.sentiment_score) as avg_sentiment2,
     count(DISTINCT p1) as team_size1, count(DISTINCT p2) as team_size2
WHERE abs(avg_sentiment1 - avg_sentiment2) < 0.1 
  AND abs(team_size1 - team_size2) <= 1
RETURN c1.name, c2.name, avg_sentiment1, avg_sentiment2, team_size1, team_size2
```

### 3.4 Bug & Issue Patterns

```cypher
// Query 6: Find bug clusters that suggest systemic issues
MATCH (b1:Bug)-[:DISCOVERED]->(a:Agent)-[:DISCOVERED]->(b2:Bug)
WHERE b1 <> b2 
  AND duration.between(b1.timestamp, b2.timestamp).days <= 30
MATCH (b1)-[:LED_TO]->(root1:Learning_Entry {learning_type: "root_cause"})
MATCH (b2)-[:LED_TO]->(root2:Learning_Entry {learning_type: "root_cause"})
WHERE root1.content CONTAINS root2.content OR root2.content CONTAINS root1.content
RETURN a.name, collect(b1.title + " | " + b2.title) as related_bugs,
       root1.content as common_root_cause
```

### 3.5 Communication Effectiveness

```cypher
// Query 7: Find communication patterns that lead to faster resolutions
MATCH (p:Person)-[:SENT]->(m:Message)-[:PART_OF]->(conv:Conversation)
MATCH (conv)-[:TRIGGERED]->(d:Decision)-[:LED_TO]->(o:Outcome)
WHERE o.outcome_type = "resolution_time"
WITH conv, count(m) as message_count, avg(m.confidence_score) as avg_confidence,
     o.value as resolution_time
WHERE message_count >= 3
RETURN message_count, avg_confidence, avg(resolution_time) as avg_resolution_time
ORDER BY avg_resolution_time ASC
```

### 3.6 Identity & Security Analysis

```cypher
// Query 8: Trace the Sam/Santos identity crisis incident and its impacts
MATCH (sam:Agent {name: "Sam"})-[:INVOLVED_IN]->(i:Incident {incident_type: "identity_crisis"})
MATCH (i)-[:LED_TO*1..3]->(outcome:Outcome)
MATCH (i)<-[:LEARNED_FROM]-(learning:Learning_Entry)
OPTIONAL MATCH (i)-[:AFFECTED]->(entity)
RETURN i.description, collect(DISTINCT outcome.metric_name) as impacts,
       collect(DISTINCT learning.content) as lessons,
       collect(DISTINCT entity.name) as affected_entities
```

### 3.7 Feature Success Prediction

```cypher
// Query 9: Find feature request patterns that predict high client satisfaction
MATCH (p:Person)-[:REQUESTED]->(f:Feature)-[:LED_TO]->(o:Outcome {metric_name: "client_satisfaction"})
MATCH (p)-[:WORKS_FOR]->(c:Client)
WHERE o.value >= 8.0
WITH f.priority, f.complexity_score, c.industry, count(*) as success_count
MATCH (p2:Person)-[:REQUESTED]->(f2:Feature)-[:LED_TO]->(o2:Outcome {metric_name: "client_satisfaction"})
MATCH (p2)-[:WORKS_FOR]->(c2:Client {industry: c.industry})
WHERE f2.priority = f.priority AND f2.complexity_score = f.complexity_score
RETURN f.priority, f.complexity_score, c.industry,
       success_count * 1.0 / count(*) as success_rate
ORDER BY success_rate DESC
```

### 3.8 Cross-Agent Collaboration

```cypher
// Query 10: Find agents that work well together on complex issues
MATCH (a1:Agent)-[:MADE]->(d1:Decision)-[:LED_TO]->(d2:Decision)<-[:MADE]-(a2:Agent)
MATCH (d2)-[:LED_TO]->(o:Outcome)
WHERE a1 <> a2 AND o.value > o.baseline_value
WITH a1, a2, count(*) as collaborations, avg(o.value - o.baseline_value) as avg_improvement
WHERE collaborations >= 3
RETURN a1.name, a2.name, collaborations, avg_improvement
ORDER BY avg_improvement DESC
```

## 4. Schema Diagram (ASCII)

```
                    VULKN AI AGENT PLATFORM - KNOWLEDGE GRAPH SCHEMA

    [Founder]───FOUNDED───[VULKN]───EMPLOYS───[Agent]───SERVES───[Client]───EMPLOYS───[Person]
        │                                         │         │         │                    │
    Bridget, Johan                               Sam      │    Click_Seguros         Javier (CEO)
                                                Sybil     │    Senda_Chat           Suzanne
                                                Saber     │                         Jaime
                                                Santos    │                         Eder
                                                Sage      │                           │
                                                  │       │                           │
                                             INVOLVED_IN  │                    PARTICIPATES_IN
                                                  │       │                           │
                                            [Incident]    │                           │
                                         (identity_crisis) │                          │
                                                  │       │                           │
                                              LED_TO      │                           │
                                                  │       │                           │
                                            [Learning]    │                           │
                                             [Pattern]    │                           │
                                                  │       │                           │
                                              EXHIBITS    │                           │
                                                  │       │                           │
    [Query]───ANSWERS───[Pattern]                │       │                           │
        │                  │                     │       │                           │
   "what do clients    CREATED_FROM             │       │                           │
    need after 6mo?"       │                     │       │                           │
                           │                     │       │                           │
                      [Analysis]                │       │                           │
                           │                     │       │                           │
                     DISCOVERED                 │       │                           │
                           │                     │       │                           │
    [Conversation]─────────┴─TRIGGERED─────[Decision]────┘                           │
          │                                     │                                     │
    PART_OF│                                LED_TO                                   │
          │                                     │                                     │
    [Message]◄─────SENT─────────────────────────┼─────────────────────────────────────┘
          │                                     │
      timestamp                                 │
      content                              [Feature]────IMPLEMENTED────[Agent]
      sentiment                                 │              │
      confidence                           REQUESTED          │
                                               │              │
                                          [Person]            │
                                               │              │
                                          WORKS_FOR           │
                                               │              │
                                          [Client]            │
                                               │              │
                                            SERVES            │
                                               │              │
                                          [Agent]─────────────┘
                                               │
                                         DISCOVERED
                                               │
                                          [Bug]────RESOLVED────[Agent]
                                               │
                                           LED_TO
                                               │
                                         [Outcome]◄───LED_TO────[Decision]
                                               │                     │
                                         business_impact         reasoning
                                         trend_direction         confidence
                                         measurement_date        timestamp

                         [Document]───MENTIONED_IN───[Entity]
                              │
                         contracts
                         reports
                         specifications
                         logs
```

## 5. Implementation Recommendations

### 5.1 Technology Stack Alignment

**Recommended: Neo4j Aura (Cloud)**

**Why Neo4j fits VULKN's stack:**
- **Python Integration**: Excellent neo4j-driver for Python/FastAPI backends
- **React/Next.js**: Neo4j GraphQL Library provides auto-generated GraphQL APIs
- **Supabase Complement**: Neo4j for relationships, Supabase for operational data
- **Query Power**: Cypher is purpose-built for complex relationship queries
- **Scalability**: Aura handles scaling automatically
- **Prototype Speed**: Can be up in days, not weeks

### 5.2 Hybrid Architecture Approach

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │    │    Neo4j Aura    │    │   React/Next.js │
│   (PostgreSQL)  │    │   (Knowledge     │    │   Frontend      │
│                 │    │    Graph)        │    │                 │
│ • User accounts │    │ • Relationships  │    │ • Dashboard     │
│ • Transactions  │    │ • Patterns       │    │ • Graph viz     │
│ • Audit logs    │    │ • Insights       │    │ • Query builder │
│ • Real-time ops │    │ • Cross-client   │    │ • Insights UI   │
│                 │    │   analysis       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │                     │
                    │ • Data orchestration│
                    │ • ETL pipelines     │
                    │ • Business logic    │
                    │ • API aggregation   │
                    └─────────────────────┘
```

### 5.3 Data Flow Strategy

1. **Operational Data**: Supabase handles transactions, user auth, real-time updates
2. **Graph Sync**: ETL pipeline syncs relevant data to Neo4j nightly/hourly
3. **Relationship Discovery**: Neo4j analyzes patterns and creates insights
4. **Query Interface**: FastAPI aggregates both systems for frontend
5. **Real-time Updates**: Supabase real-time for ops, Neo4j for analysis

### 5.4 Alternative: Supabase + JSON Graph (Lower Complexity)

If Neo4j feels too heavy initially:

```sql
-- PostgreSQL with JSON graph representation
CREATE TABLE graph_nodes (
  id UUID PRIMARY KEY,
  node_type TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE graph_relationships (
  id UUID PRIMARY KEY, 
  from_node UUID REFERENCES graph_nodes(id),
  to_node UUID REFERENCES graph_nodes(id),
  relationship_type TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Graph traversal with recursive CTEs
WITH RECURSIVE relationship_path AS (
  SELECT from_node, to_node, relationship_type, 1 as depth
  FROM graph_relationships 
  WHERE from_node = 'sam_agent_id'
  
  UNION ALL
  
  SELECT gr.from_node, gr.to_node, gr.relationship_type, rp.depth + 1
  FROM graph_relationships gr
  JOIN relationship_path rp ON gr.from_node = rp.to_node
  WHERE rp.depth < 5
)
SELECT * FROM relationship_path;
```

**Pros**: Stays in existing Supabase, familiar PostgreSQL  
**Cons**: Limited graph query power, manual relationship traversal

### 5.5 Prototype Implementation Plan

**Week 1: Core Entities**
- Set up Neo4j Aura instance
- Define core node types (Agent, Client, Person, Conversation)
- Create basic relationships (SERVES, WORKS_FOR, PARTICIPATES_IN)
- Import real data: Sam, Click Seguros team, conversation samples

**Week 2: Conversations & Decisions**
- Add Message, Decision, Feature, Bug entities
- Create conversation flow relationships
- Implement basic pattern detection for decision chains
- Test query: "Show Sam's decision patterns with Click Seguros"

**Week 3: Learning & Patterns**
- Add Learning_Entry, Pattern, Incident entities
- Implement cross-client pattern discovery
- Create the Santos identity crisis incident as test case
- Test query: "Find similar onboarding patterns across clients"

**Week 4: Integration & UI**
- Connect Neo4j to FastAPI backend
- Create GraphQL schema for frontend
- Build basic React dashboard with D3.js graph visualization
- Deploy prototype with sample queries

### 5.6 Success Metrics

**Technical Success:**
- Query response time < 500ms for complex relationship traversals
- Data sync lag < 1 hour from operational systems
- Graph visualization renders smoothly with 100+ nodes

**Business Success:**
- Discover 3+ actionable cross-client patterns in first month
- Research queries provide insights that weren't possible before
- Field agents (like Sam) can self-serve analysis queries
- Client satisfaction correlations guide agent improvements

### 5.7 Cost Estimation

**Neo4j Aura**: ~$65/month for startup tier (sufficient for prototype)  
**Development Time**: ~80 hours over 4 weeks  
**Total Month 1 Cost**: <$100 infrastructure + development time

**Alternative**: Supabase JSON graph adds ~0 monthly cost, ~60 hours dev time

## 6. Next Steps for Prototyping

1. **Set up Neo4j Aura** sandbox environment
2. **Create sample dataset** with Sam, Click Seguros, and conversation history
3. **Implement 3-5 core queries** that demonstrate graph advantages
4. **Build minimal FastAPI** integration layer
5. **Create simple React** dashboard for query results
6. **Test with real VULKN team** for feedback and iteration

## 7. Risk Mitigation

**Data Privacy**: Graph contains client data - implement proper access controls  
**Query Performance**: Index heavily-traversed relationships, limit query depth  
**Data Consistency**: Implement conflict resolution between Supabase and Neo4j  
**Learning Curve**: Neo4j/Cypher training for development team  
**Vendor Lock-in**: Keep data export capabilities, consider multi-graph strategy

This ontology provides a solid foundation for prototyping this month while maintaining flexibility for future evolution as VULKN's agent platform grows.