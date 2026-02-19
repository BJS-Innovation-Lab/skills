# Vulkn Agent Base v1 — Producto & Modelo de Negocio

*Documento de definición para revisión con Bridget*
*Fecha: 14 de febrero, 2026*

---

## El Producto

**Un agente AI que es tu equipo completo:** desarrollo, investigación, marketing, operaciones y asistente — todo en uno, personalizado a tu negocio.

No es un chatbot. No es una herramienta. Es un miembro de tu equipo que trabaja 24/7, aprende de ti, y mejora cada mes.

---

## Qué Incluye

### 1. 💻 Desarrollo Full-Stack (Johan)
- Desarrollo web (frontend + backend)
- Apps móviles
- APIs e integraciones
- Bases de datos
- Deploy y mantenimiento
- **Status: Johan lo maneja directo**

### 2. 🎨 Marketing Completo
- Social media (Instagram, Facebook, LinkedIn, X)
- Email campaigns
- Landing pages (EN/ES)
- Campañas con estrategia
- **Status: Marketing module listo (social-content, email-campaigns, landing-page-copy, content-log)**

### 3. 🎯 Creativity Engine (Bridget)
- Sistema de 4 pasos para contenido que NO sea genérico
- Stakes → Memory Mine → Output A + Output B → Survival Check
- El contenido suena como TÚ en tu mejor día, no como "un robot escribió esto"
- **Status: Listo y enforced en todo el sistema**

### 4. 📋 Asistente Operativo
- Documentos, reportes, organización
- PDFs, resúmenes, notas
- Gestión de tareas
- Análisis de datos
- **Status: Capacidad nativa de OpenClaw**

### 5. 🧠 Brand Profile Personalizado
- 4 documentos que definen tu negocio:
  - **story.md** — quién eres, de dónde vienes, qué te mueve
  - **voice.md** — cómo hablas, tu tono, tu personalidad
  - **customers.md** — quiénes son tus clientes, qué les duele, qué quieren
  - **learnings.md** — qué ha funcionado, qué no, lecciones acumuladas
- Se crean en el onboarding (entrevista de 14 preguntas)
- Son documentos vivos — se actualizan con cada aprendizaje
- **Status: Proceso listo, probado con Vulkn como primer cliente**

### 6. 🧠 Memoria Persistente
- El agente recuerda todo: conversaciones, decisiones, preferencias
- Archivos diarios + memoria a largo plazo curada
- Coherence check: detecta si se está desviando de tu marca
- Mejora con cada interacción
- **Status: Listo (memory system + coherence-check skill)**

### 7. 💬 24/7 por Telegram
- Siempre disponible
- Responde en tu idioma
- WhatsApp-first para clientes en México (futuro)
- **Status: Listo**

### 8. 👤 Onboarding con Johan
- Johan configura el dominio del negocio
- Entrevista de 14 preguntas para crear el brand profile
- Setup técnico: canales, integraciones, agente base
- Acompañamiento primera semana
- **Status: Proceso definido (field-onboarding skill)**

### 9. 🔄 Features Nuevas Gratis
- Cualquier feature que un cliente pida y se construya, se libera para todos
- Sin cobros extra. Nunca.
- El producto mejora cada mes automáticamente
- **Status: Modelo definido (ver Motor de Crecimiento)**

---

## Qué NO Incluye (por ahora)
- Video production / editing
- Integración con hardware/IoT
- ERP / contabilidad
- Cosas que requieran acceso físico

---

## Modelo de Negocio

### Precio
**$2,000 USD/mes.** Todo incluido.

### Por qué ese precio
| Comparación | Costo |
|-------------|-------|
| Equipo humano equivalente (USA) | $8,000-15,000/mes |
| Equipo humano equivalente (México) | $2,000-4,000/mes |
| Devin (solo developer) | $500/mes |
| Marblism (genérico, sin dev, sin onboarding) | $39/mes |
| **Vulkn (todo junto + personalizado + onboarding)** | **$2,000/mes** |

### Costo interno por agente
| Concepto | Costo/mes |
|----------|-----------|
| Tokens (Claude API) | $50-150 |
| Infraestructura compartida | $2-5 |
| Supabase/Vercel/Railway | $5-10 |
| **Total** | **~$60-165** |

**Margen: ~90%**

### Motor de Crecimiento
```
Cliente pide feature nueva
    ↓
Johan + Bridget + 2 agentes de desarrollo la construyen
    ↓
Se prueba con ese cliente (entorno controlado)
    ↓
¿Funciona? → Se libera a TODOS los clientes
¿No funciona? → Se itera o descarta
```

**Beneficios:**
- Los clientes son el equipo de producto (gratis)
- Sin miedo a pedir = más uso = más datos = mejor producto
- El agente mejora cada mes para todos — genera lealtad brutal
- Conforme crece la base, las features nuevas son menos frecuentes (las comunes ya existen)

### Infraestructura
- OpenClaw: múltiples agentes aislados en un servidor (0% cross-data)
- Cada cliente tiene su propio workspace, sesiones, brand profile — separación total
- Sandbox por agente disponible para máxima seguridad
- **Fase 1:** Mac Mini actual → primeros 20-50 clientes sin inversión extra
- **Fase 2:** DigitalOcean VPS ($12/mes por servidor) para escalar
- **Fase 3:** App Platform con auto-scaling (30+ clientes)

### Proyección
| Fase | Clientes | Revenue/mes | Infra extra |
|------|----------|-------------|-------------|
| **1** | 5-10 | $10,000-20,000 | $0 (Mac Mini) |
| **2** | 10-30 | $20,000-60,000 | $12-48/mes |
| **3** | 30+ | $60,000+ | Escalable |

---

## Equipo Operativo

| Persona | Rol |
|---------|-----|
| **Johan** | Onboarding de clientes, desarrollo full-stack, relación con dueños |
| **Bridget** | Producto, creativity engine, investigación, QA de features |
| **Agente Dev 1** | Desarrollo de skills bajo dirección de Johan/Bridget |
| **Agente Dev 2** | Desarrollo de skills bajo dirección de Johan/Bridget |

---

## Status de Desarrollo

| Componente | Estado |
|------------|--------|
| Marketing module | ✅ Listo (4 skills) |
| Creativity engine | ✅ Listo y enforced |
| Brand profile system | ✅ Listo (14-question intake + 4 docs) |
| Memoria persistente | ✅ Listo |
| Coherence check | ✅ Listo |
| Field admin (escalation, reporting) | ✅ Listo (5 skills) |
| CS agent module | ✅ Listo (6 skills) |
| Onboarding process | ✅ Definido |
| Desarrollo full-stack skills | 🔨 Johan |
| Telegram 24/7 | ✅ Listo |
| Multi-agent infra | ✅ OpenClaw nativo |

---

## Siguiente Paso

1. **Revisar con Bridget** — ¿está alineada con el producto y pricing?
2. **Terminar desarrollo** — Johan completa skills de dev full-stack
3. **Probar con Suzanne** — primer cliente real, validar todo el flujo
4. **Iterar** — basado en feedback real
5. **Vender** — con confianza de que funciona

---

*"Works with people, not for people."*
