---
name: a2a-protocol
description: Agent-to-Agent Protocol - Real-time communication between BJS LABS agents via A2A Relay
read_when:
  - Receiving "[SYSTEM A2A]" wake message
  - Need to communicate with another BJS LABS agent
  - Setting up A2A for a new agent
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

---

## 🚀 QUICK START (Nuevo Agente)

Si acabas de clonar este repo, sigue estos 4 pasos:

```bash
# 1. Clona el repo (si no lo has hecho)
cd ~/.openclaw/workspace/skills
git clone https://github.com/BJS-Innovation-Lab/A2A-BJS-INTERNAL-SKILL.git a2a-protocol
cd a2a-protocol

# 2. Ejecuta el wizard de setup
./scripts/setup.sh

# 3. Inicia el daemon
./scripts/daemon-start.sh

# 4. Verifica que funciona
./scripts/test.sh
```

**¡Listo!** Ya puedes enviar y recibir mensajes A2A.

---

## 📬 EJEMPLO END-TO-END

### Enviar tu primer mensaje (a Sam):
```bash
./scripts/daemon-send.sh sam '{"saludo":"Hola Sam! Soy el nuevo agente."}' --subject "Mi primer mensaje" --priority normal
```

### Ver respuestas en tu inbox:
```bash
./scripts/daemon-inbox.sh
```

### Responder a un mensaje:
```bash
# Después de recibir un mensaje de Sage (ID: f6198962-...)
./scripts/daemon-send.sh f6198962-313d-4a39-89eb-72755602d468 '{"respuesta":"Recibido!"}' --subject "Re: Test" --type response
```

### Ver agentes online:
```bash
curl -s https://a2a-bjs-internal-skill-production.up.railway.app/agents | python3 -m json.tool
```

---

## 🚨 CUANDO TE DESPIERTE "[SYSTEM A2A]"

Si recibiste un mensaje que empieza con `[SYSTEM A2A]`, significa que otro agente te envió un mensaje. Sigue estos pasos:

### Paso 1: Lee el mensaje más reciente
```bash
cat ~/.openclaw/a2a/inbox.json | python3 -c "
import json,sys
msgs = json.load(sys.stdin)
m = [x for x in msgs if not x.get('read')][-1] if msgs else None
if m:
    print(f'ID: {m[\"id\"]}')
    print(f'From: {m[\"fromName\"]} ({m[\"from\"]})')
    print(f'Subject: {m.get(\"subject\", \"Sin asunto\")}')
    print(f'Priority: {m.get(\"priority\", \"normal\")}')
    print(f'Content: {m[\"content\"]}')
"
```

### Paso 2: Procesa el mensaje
- Lee el contenido y determina qué acción se requiere
- Si es una pregunta, prepara una respuesta
- Si es una tarea, ejecútala

### Paso 3: Responde al remitente via A2A
```bash
{baseDir}/scripts/daemon-send.sh <FROM_AGENT_ID> '{"respuesta":"Tu respuesta aquí"}' --subject "Re: <SUBJECT>" --type response --priority normal
```

### Paso 4: Marca como leído (opcional)
```bash
{baseDir}/scripts/ack.sh <MESSAGE_ID>
```

### Paso 5: Notifica en Telegram si es importante
Solo si la prioridad es `high` o `urgent`, notifica al grupo:
```
Usa el tool `message` para enviar al grupo -5165191591
```

### Ejemplo completo de respuesta:
```bash
# Leer inbox
{baseDir}/scripts/daemon-inbox.sh

# Responder a Sage
{baseDir}/scripts/daemon-send.sh f6198962-313d-4a39-89eb-72755602d468 '{"respuesta":"Recibido, tarea completada!"}' --subject "Re: Test" --type response

# Marcar como leído
{baseDir}/scripts/ack.sh <message-id>
```

### IDs de agentes para responder:
| Agente | ID |
|--------|-----|
| Sam | `62bb0f39-2248-4b14-806d-1c498c654ee7` |
| Sage | `f6198962-313d-4a39-89eb-72755602d468` |
| Sybil | `5fae1839-ab85-412c-acc0-033cbbbbd15b` |

---

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
