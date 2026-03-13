# Lo que necesitamos de Pepe Feria

## Antes de empezar (Semana 0)

### APIs y Accesos
- [ ] **API de usuarios** — consultar status, monto aprobado, fechas
  - Endpoint: GET /users/{phone}/status
  - Auth: API key o OAuth
  
- [ ] **API de solicitudes** — crear, actualizar solicitudes
  - Endpoint: POST /applications
  - Campos: user_id, amount, documents[]
  
- [ ] **Webhook de eventos** — notificarnos cuando:
  - Solicitud aprobada
  - Depósito realizado
  - Pago procesado
  - Pago fallido

### WhatsApp
- [ ] **Opción A:** Nos dan acceso a su WhatsApp Business existente
- [ ] **Opción B:** Usamos número Twilio de VULKN (+52...)

### Documentos y Conocimiento
- [ ] **FAQs actuales** — todas las preguntas frecuentes
- [ ] **Políticas** — términos de servicio, privacidad
- [ ] **Guía de elegibilidad** — quién puede pedir, cuánto, cuándo
- [ ] **Ejemplos de conversaciones** — 20-30 chats reales (anonimizados)

---

## Para Verificación de Documentos

### Reglas de validación
- [ ] **INE:** ¿Qué hace una INE válida? ¿Aceptan vencidas?
- [ ] **Recibo de nómina:** ¿Qué datos extraer? ¿Antigüedad máxima?
- [ ] **Comprobante domicilio:** ¿Cuáles aceptan? ¿Antigüedad?
- [ ] **Cuenta bancaria:** ¿Solo CLABE o también tarjeta?

### Formato de datos
- [ ] **JSON schema** esperado para documentos verificados
- [ ] **Endpoint** donde guardar documentos aprobados
- [ ] **Ejemplos** de documentos buenos y rechazados (5-10 de cada tipo)

---

## Para Análisis de Riesgo SAT/IMSS

### Datos
- [ ] **Acceso a reportes SAT** — API o base de datos
- [ ] **Lista de empleadores aprobados** — empresas ya validadas
- [ ] **Reglas de scoring** actuales:
  - ¿Qué score mínimo aprueban?
  - ¿Qué alertas son bloqueantes? (69-B, PROFECO)
  - ¿Monto máximo por score?

### Integración
- [ ] **API SAT/IMSS** que usan (¿Majema? ¿Otra?)
- [ ] **Credenciales** de acceso (sandbox primero)

---

## Para Recordatorios/Cobranza

### Calendario
- [ ] **Fechas de nómina** por empleador (o API para consultarlas)
- [ ] **Webhook** cuando se procesa/falla un pago

### Mensajes
- [ ] **Templates aprobados** por legal para:
  - Confirmación de depósito
  - Recordatorio pre-quincena
  - Notificación de descuento
  - Seguimiento por falla
  
- [ ] **Reglas de escalación:**
  - ¿Cuántos mensajes antes de llamar?
  - ¿Horarios permitidos para mensajes?
  - ¿Contacto de cobranza humana?

---

## Contactos Clave

| Rol | Nombre | Email/Tel |
|-----|--------|-----------|
| Sponsor ejecutivo | | |
| Contacto técnico (APIs) | | |
| Contacto de operaciones | | |
| Legal/Compliance | | |
| Soporte actual (para training) | | |

---

## Timeline de Entrega

| Semana | Qué necesitamos de ellos |
|--------|-------------------------|
| 0 | APIs docs + acceso sandbox + FAQs |
| 1 | Ejemplos de conversaciones + reglas de docs |
| 2 | Reglas de scoring + acceso SAT |
| 3 | Templates de cobranza + calendario nóminas |
| 4 | Revisión final + go-live approval |

---

## Preguntas para la primera reunión

1. ¿Tienen API documentada o necesitamos hacer ingeniería inversa?
2. ¿Cuántas conversaciones de soporte manejan al mes?
3. ¿Cuál es su tasa de rechazo actual y por qué razones?
4. ¿Qué tan automatizado está su proceso hoy?
5. ¿Quién toma la decisión final de aprobar una solicitud?
6. ¿Tienen problemas de mora? ¿Qué porcentaje?
7. ¿Con cuántos empleadores tienen convenio actualmente?
