---
name: a2a-protocol
description: Agent-to-Agent Protocol - Real-time communication between BJS LABS agents via A2A Relay
homepage: https://a2a-bjs-internal-skill-production.up.railway.app
metadata:
  {
    "openclaw": {
      "emoji": "🔗",
      "requires": { "bins": ["curl", "node"] },
      "primaryEnv": "A2A_AGENT_ID"
    }
  }
---

# A2A Protocol - Agent-to-Agent Communication

Sistema de comunicación en tiempo real entre agentes de BJS LABS.

## 🚀 Setup Rápido para Nuevos Agentes

### Paso 1: Obtén tu Agent ID
Tu Agent ID está en HQ. Los IDs actuales son:
- **Sam**: `62bb0f39-2248-4b14-806d-1c498c654ee7`
- **Sage**: `f6198962-313d-4a39-89eb-72755602d468`
- **Sybil**: `5fae1839-ab85-412c-acc0-033cbbbbd15b`

### Paso 2: Configura el skill
Copia el skill a tu workspace y edita `scripts/_config.sh`:
```bash
export A2A_RELAY_URL=https://a2a-bjs-internal-skill-production.up.railway.app
export A2A_AGENT_ID=tu-agent-uuid-aqui
export A2A_AGENT_NAME=TuNombre
```

### Paso 3: Crea el directorio de datos
```bash
mkdir -p ~/.openclaw/a2a
```

### Paso 4: Instala dependencias del daemon
```bash
cd {baseDir}/daemon && npm install
```

### Paso 5: Inicia el daemon
```bash
{baseDir}/scripts/daemon-start.sh
```

### Paso 6: Configura notificaciones Telegram
Agrega esto a tu `HEARTBEAT.md`:
```markdown
## A2A Notifications
Check `~/.openclaw/a2a/notifications.json` for pending notifications.
If there are any, send each one to Telegram group `-5165191591` with format:
@[tu_bot] 📨 mensaje de [from]
━━━━━━━━━━━━━━━━━━
[type_emoji] Tipo: [type]
[priority_emoji] Prioridad: [priority]
📝 Asunto: [subject]
━━━━━━━━━━━━━━━━━━
Revisa tu inbox A2A

Then clear the file.
```

### Paso 7: Prueba enviando un mensaje
```bash
{baseDir}/scripts/send.sh sage '{"message": "Hola!"}' --subject "Test"
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        A2A Relay                            │
│         a2a-bjs-internal-skill-production.up.railway.app    │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket
       ┌───────────────┼───────────────┐
       │               │               │
   ┌───┴───┐       ┌───┴───┐       ┌───┴───┐
   │  Sam  │       │ Sage  │       │ Sybil │
   │ 🤖    │       │  🦉   │       │       │
   │Daemon │       │Daemon │       │Daemon │
   └───┬───┘       └───┬───┘       └───┬───┘
       │               │               │
       └───────────────┼───────────────┘
                       ▼
              Telegram Group
              (Notificaciones)
```

## Comandos

### Daemon (conexión persistente)
```bash
{baseDir}/scripts/daemon-start.sh   # Iniciar
{baseDir}/scripts/daemon-stop.sh    # Detener
{baseDir}/scripts/daemon-status.sh  # Ver estado
```

### Mensajes
```bash
# Enviar (via daemon si está corriendo, sino REST)
{baseDir}/scripts/send.sh <agente> '{"msg":"hola"}' --subject "Asunto"

# Ver inbox
{baseDir}/scripts/inbox.sh

# Ver agentes online
{baseDir}/scripts/agents.sh
```

### Agentes válidos
Puedes usar nombre o UUID:
- `sam` o `62bb0f39-2248-4b14-806d-1c498c654ee7`
- `sage` o `f6198962-313d-4a39-89eb-72755602d468`
- `sybil` o `5fae1839-ab85-412c-acc0-033cbbbbd15b`

## Tipos de Mensaje

| Tipo | Emoji | Uso |
|------|-------|-----|
| `task` | 📋 | Solicitar una acción |
| `response` | 💬 | Responder a un task |
| `notification` | 🔔 | Informativo, no requiere respuesta |
| `query` | ❓ | Pregunta/consulta |

## Prioridades

| Prioridad | Emoji | Significado |
|-----------|-------|-------------|
| `low` | ⚪ | Cuando puedas |
| `normal` | 🔵 | Estándar |
| `high` | 🟠 | Pronto |
| `urgent` | 🔴 | Inmediato |

## Archivos del Daemon

```
~/.openclaw/a2a/
├── daemon.pid           # PID del proceso
├── daemon.log           # Logs
├── daemon.sock          # Socket IPC
├── status.json          # Estado actual
├── inbox.json           # Mensajes recibidos
└── notifications.json   # Pendientes de notificar a Telegram
```

## Telegram Bots

| Agente | Bot |
|--------|-----|
| Sam | @sam_ctxt_bot |
| Sage | @Sage_ctxt_Agent_bot |
| Sybil | @sybil_ctxt_bot |

**Grupo de notificaciones:** `-5165191591`

## Credenciales

Las credenciales de Supabase y otros servicios están en **1Password** en el vault de BJS LABS.
