# VULKN x Pepe Feria
## Propuesta de Agente IA Integral

---

## Resumen Ejecutivo

VULKN desplegará un sistema completo de agentes IA para Pepe Feria que automatiza:
- Atención al cliente 24/7 vía WhatsApp
- Recolección y verificación de documentos
- Análisis de riesgo crediticio con datos SAT/IMSS
- Recordatorios y seguimiento de cobranza

**Inversión:** $8,000 USD/mes (todo incluido)
**Tiempo de implementación:** 3-4 semanas
**ROI esperado:** Reducción 60-70% en costos de soporte + aceleración de onboarding

---

## Módulo 1: Agente de WhatsApp — Atención al Cliente

### Funcionalidades
| Función | Descripción |
|---------|-------------|
| FAQs automáticos | Responde preguntas frecuentes 24/7 |
| Estado de solicitud | "¿Ya me depositaron?" → consulta sistema |
| Elegibilidad | "¿Cuánto puedo pedir?" → calcula en tiempo real |
| Guía de documentos | Explica qué necesitan y cómo enviarlos |
| Escalación inteligente | Detecta frustración → transfiere a humano |
| Multiidioma | Español + soporte para dialectos regionales |

### Lo que necesitamos de Pepe Feria
- [ ] API de consulta de usuarios (status, monto aprobado, fechas)
- [ ] Base de conocimientos (FAQs, políticas, términos)
- [ ] Número WhatsApp Business (o usamos Twilio nuestro)
- [ ] Contactos para escalación (nombres, horarios)
- [ ] Casos de ejemplo (conversaciones reales anonimizadas)

### Métricas de éxito
- 70% de consultas resueltas sin humano
- Tiempo de respuesta <2 minutos
- NPS de usuarios atendidos por IA >8

---

## Módulo 2: Recolección y Verificación de Documentos

### Flujo
```
Usuario envía foto INE → OCR extrae datos → Valida formato/legibilidad
                                          → Extrae CURP, nombre, fecha
                                          → Compara con datos registrados
                                          → ✅ Aprobado o ❌ "Envía de nuevo"
```

### Documentos soportados
| Documento | Validación |
|-----------|------------|
| INE/IFE | OCR + verificación de vigencia |
| Recibo de nómina | Extracción de: empresa, salario, fecha |
| Comprobante de domicilio | Extracción de dirección, fecha <3 meses |
| CLABE/Cuenta bancaria | Validación de formato (18 dígitos) |

### Lo que necesitamos de Pepe Feria
- [ ] Reglas de validación (qué hace un documento "válido")
- [ ] Integración con su sistema para guardar documentos aprobados
- [ ] Formato esperado de datos extraídos (JSON schema)
- [ ] Ejemplos de documentos buenos y malos

### Métricas de éxito
- 90% de documentos procesados automáticamente
- Reducción de 80% en revisión manual
- Tiempo de onboarding: de días → horas

---

## Módulo 3: Análisis de Riesgo con Datos SAT/IMSS

### Capacidades
Usando los reportes tipo "Majema" que ya tienen:

| Análisis | Uso |
|----------|-----|
| Score crediticio empresa (0-1000) | Validar que el empleador es confiable |
| Datos de nómina IMSS | Confirmar que el usuario está activo |
| Historial de facturación | Detectar empresas en declive |
| Alertas PROFECO/69-B | Rechazar automáticamente empresas problemáticas |

### Flujo de decisión
```
Usuario solicita adelanto
    → Agente consulta empleador en base de datos SAT
    → Score >700 + nómina activa + sin alertas = APROBADO AUTO
    → Score 500-700 = REVISIÓN MANUAL
    → Score <500 o alertas = RECHAZADO + explicación
```

### Lo que necesitamos de Pepe Feria
- [ ] Acceso a su base de reportes SAT/IMSS (API o dump)
- [ ] Reglas de negocio actuales (¿qué score aprueban hoy?)
- [ ] Lista de empleadores ya aprobados
- [ ] Criterios de rechazo automático

### Métricas de éxito
- Reducción de mora en 15-20%
- 50% de solicitudes aprobadas automáticamente
- Tiempo de decisión: de horas → segundos

---

## Módulo 4: Recordatorios y Cobranza Suave

### Funcionalidades
| Mensaje | Timing |
|---------|--------|
| Confirmación de depósito | Inmediato al depositar |
| Recordatorio pre-quincena | 3 días antes del descuento |
| Notificación de descuento | Día del corte de nómina |
| Seguimiento si falla | Si no se descontó, contactar |

### Tono
- Amigable, no amenazante
- "Oye, solo para que lo tengas en cuenta..."
- Emojis moderados, lenguaje coloquial mexicano

### Lo que necesitamos de Pepe Feria
- [ ] Calendario de nóminas por empleador
- [ ] Webhook cuando se procesa un pago
- [ ] Reglas de escalación (¿cuándo llamar vs solo mensaje?)
- [ ] Templates aprobados por legal

---

## Arquitectura Técnica

```
┌─────────────────┐     ┌──────────────────┐
│  WhatsApp       │────▶│  VULKN Agent     │
│  (Twilio)       │◀────│  (Railway)       │
└─────────────────┘     └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │ Pepe Feria│ │ OCR/Doc   │ │ SAT/IMSS  │
            │ API       │ │ Processing│ │ Database  │
            └───────────┘ └───────────┘ └───────────┘
```

### Stack
- **Agente:** OpenClaw + Claude (Anthropic)
- **WhatsApp:** Twilio Business API
- **OCR:** Claude Vision / Google Document AI
- **Hosting:** Railway (México)
- **Base de datos:** Supabase (PostgreSQL)

---

## Inversión

| Concepto | Mensual |
|----------|---------|
| Agente WhatsApp (ilimitado) | $3,000 |
| Verificación de documentos | $2,000 |
| Análisis de riesgo SAT | $2,000 |
| Recordatorios/Cobranza | $1,000 |
| **Total** | **$8,000 USD/mes** |

### Setup inicial (una vez)
| Concepto | Costo |
|----------|-------|
| Integración con APIs Pepe Feria | $3,000 |
| Entrenamiento con datos históricos | $2,000 |
| Configuración WhatsApp Business | Incluido |
| **Total setup** | **$5,000 USD** |

### Incluye
- Soporte técnico 24/7
- Actualizaciones continuas del agente
- Dashboard de métricas
- Hasta 50,000 conversaciones/mes
- Almacenamiento de documentos 1 año

---

## Cronograma

| Semana | Entregable |
|--------|------------|
| 1 | Kick-off + integración APIs + WhatsApp conectado |
| 2 | Agente de soporte básico en producción |
| 3 | Módulo de documentos + OCR funcionando |
| 4 | Análisis de riesgo + recordatorios activos |
| 5+ | Optimización continua basada en métricas |

---

## Siguiente Paso

1. **Reunión técnica** (1 hora) — revisar APIs disponibles
2. **Acceso a sandbox** — probar integraciones
3. **Firma de contrato** — iniciar desarrollo
4. **Go-live** — 4 semanas después

---

*VULKN — AI agents that actually work*
*Contacto: bridget@vulkn-ai.com | johan@vulkn-ai.com*
