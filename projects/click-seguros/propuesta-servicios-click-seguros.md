# Propuesta de Servicios Tecnológicos

**Para:** Click Seguros Inc. S.A. de C.V.  
**De:** VULKN / BJS LABS  
**Fecha:** 12 de marzo de 2026  
**Versión:** 1.0

---

## Resumen Ejecutivo

Este documento presenta las opciones de servicio disponibles para Click Seguros, incluyendo costos, garantías de seguridad, certificaciones y términos de servicio. Nuestro objetivo es proporcionar la información necesaria para que Click Seguros tome la mejor decisión para su infraestructura tecnológica.

---

## 1. Aplicaciones Actuales

VULKN ha desarrollado y mantiene las siguientes aplicaciones para Click Seguros:

| Aplicación | Descripción | Estado |
|------------|-------------|--------|
| **CrediCLICK** | Sistema de gestión de créditos (7 pasos): simulación, cartas de aprobación, firma digital, convenios de pago | ✅ Producción |
| **CLK Agentes** | Portal de registro de agentes con panel administrativo | ✅ Producción |
| **CLK BI Dashboard** | Tablero de inteligencia de negocios | 95% completo |
| **Cargue de Pólizas** | Sistema de carga y procesamiento de pólizas (HDI) | ✅ Producción |
| **Landing Pages** | Páginas de marca Click Seguros | ✅ Producción |

---

## 2. Infraestructura y Seguridad Actual

### Arquitectura Cloud
Todas las aplicaciones operan en infraestructura cloud de nivel empresarial:

| Componente | Proveedor | Certificaciones |
|------------|-----------|-----------------|
| **Hosting de Aplicaciones** | Vercel | SOC 2 Type II, ISO 27001 |
| **Base de Datos** | Supabase (PostgreSQL) | SOC 2 Type II, HIPAA Ready |
| **CDN Global** | Cloudflare (vía Vercel) | ISO 27001, PCI DSS |

### Seguridad de Datos

| Medida de Seguridad | Implementación |
|---------------------|----------------|
| **Encriptación en reposo** | AES-256 (estándar bancario) |
| **Encriptación en tránsito** | TLS 1.3 / SSL automático |
| **Protección DDoS** | Cloudflare Enterprise |
| **Respaldos automáticos** | Diarios, retención 30 días |
| **Control de acceso** | Row Level Security (RLS), JWT tokens |
| **Autenticación** | Multi-factor disponible |
| **Gestión de parches** | Automática (servicios administrados) |
| **Monitoreo** | 24/7 con alertas automáticas |

### Disponibilidad (SLA)

| Métrica | Garantía |
|---------|----------|
| **Uptime** | 99.9% mensual |
| **Tiempo de respuesta** | < 200ms (promedio global) |
| **RPO (Recovery Point Objective)** | 24 horas |
| **RTO (Recovery Time Objective)** | 4 horas |

---

## 3. Opciones de Servicio

### Opción A: Servicio Administrado (Recomendado)

VULKN continúa operando y manteniendo toda la infraestructura.

**Incluye:**
- Hosting de todas las aplicaciones
- Base de datos administrada
- Respaldos automáticos diarios
- Actualizaciones de seguridad
- Soporte técnico prioritario
- Monitoreo 24/7
- SLA de disponibilidad 99.9%

**Inversión Mensual:**

| Concepto | Costo |
|----------|-------|
| Licencia de aplicaciones (5 apps) | $50,000 MXN |
| Infraestructura cloud | $15,000 MXN |
| Soporte prioritario | $10,000 MXN |
| **Total** | **$75,000 MXN/mes** |

**Términos:**
- Contrato mínimo: 12 meses
- Facturación mensual
- NDA incluido
- Escalamiento de capacidad sin costo adicional

---

### Opción B: Migración a Infraestructura Propia

VULKN apoya la migración de aplicaciones y datos a servidores administrados por Click Seguros.

**Alcance:**
- Documentación de arquitectura actual
- Scripts de migración de base de datos (PostgreSQL → SQL Server)
- Reescritura de conexiones de base de datos
- Conversión de aplicaciones para IIS/Windows Server
- Soporte durante implementación (30 días)
- Transferencia de conocimiento

**Inversión Única:**

| Concepto | Costo |
|----------|-------|
| Documentación y análisis | $25,000 MXN |
| Scripts de migración y testing | $35,000 MXN |
| Soporte de implementación (80 hrs) | $120,000 MXN |
| Soporte post-migración (30 días) | $50,000 MXN |
| **Total** | **$230,000 MXN** |

**Exclusiones:**
- Licencias de Microsoft (Windows Server, SQL Server)
- Configuración de hardware/red
- Certificados SSL
- Remediación de calidad de datos
- Soporte después de 30 días

**Costos Adicionales para Click Seguros (estimado mensual):**

| Concepto | Costo Estimado |
|----------|----------------|
| Windows Server | $1,000-2,000 MXN |
| SQL Server | $2,000-4,000 MXN |
| SSL/Certificados | $200-500 MXN |
| Mantenimiento IT | Variable |
| **Total Estimado** | **$4,000-10,000 MXN/mes** |

---

## 4. Comparativa de Opciones

| Factor | Opción A (Administrado) | Opción B (Migración) |
|--------|-------------------------|----------------------|
| **Costo inicial** | $0 | $230,000 MXN |
| **Costo mensual** | $75,000 MXN | $4,000-10,000 MXN + IT interno |
| **Seguridad** | SOC 2, encriptación, DDoS | Depende de implementación |
| **Respaldos** | Automáticos | Responsabilidad de CLK |
| **Actualizaciones** | Automáticas | Responsabilidad de CLK |
| **Escalabilidad** | Automática global | Limitada a servidor |
| **Soporte** | Incluido 24/7 | 30 días incluidos |
| **Tiempo de implementación** | Inmediato | 4-8 semanas |

---

## 5. Confidencialidad y NDA

VULKN se compromete a:

1. **Confidencialidad de datos:** Todos los datos de Click Seguros son tratados como información confidencial.

2. **Acceso restringido:** Solo personal autorizado de VULKN tiene acceso a los sistemas.

3. **No divulgación:** La información de Click Seguros no será compartida con terceros sin autorización expresa.

4. **Eliminación de datos:** En caso de terminación, todos los datos serán exportados a Click Seguros y eliminados de nuestros sistemas en un plazo de 30 días.

**NDA formal disponible para firma por separado.**

---

## 6. Niveles de Acceso

Para soporte y resolución de problemas, ofrecemos las siguientes opciones:

| Nivel | Descripción | Tiempo de Respuesta |
|-------|-------------|---------------------|
| **Nivel 1: Solo monitoreo** | VULKN monitorea pero no accede a datos | 24-48 horas |
| **Nivel 2: Acceso limitado** | Acceso a logs y métricas (sin datos de usuarios) | 4-8 horas |
| **Nivel 3: Acceso completo** | Acceso total para diagnóstico y reparación | 1-2 horas |

**Recomendamos Nivel 3** para soporte óptimo. El nivel de acceso puede ajustarse según las políticas de Click Seguros.

---

## 7. Próximos Pasos

1. Click Seguros revisa esta propuesta
2. Reunión de aclaración de dudas (si es necesario)
3. Selección de opción preferida
4. Firma de contrato y NDA
5. Implementación según opción elegida

---

## Contacto

**Johan Rios**  
CEO, VULKN / BJS LABS  
📧 johan@vulkn-ai.com  
📱 +52 55 3590 4118

---

*Esta propuesta es válida por 30 días a partir de la fecha de emisión.*

---

**VULKN** — Inteligencia Artificial para Negocios
