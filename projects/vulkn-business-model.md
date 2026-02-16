# VULKN — Business Model: SaaS + Business (AI Aggregator)

## El Concepto (Johan, Feb 16 2026)

VULKN es el **Order.co de la tecnología AI para empresas.**

Order.co agrega proveedores de suministros para que una empresa grande (Louis Vuitton) no tenga que ir a 50 tienditas distintas — va a un solo lugar y Order.co maneja todo.

**VULKN hace lo mismo pero con tecnología AI:**

En vez de que una PyME tenga que:
- Pagar Claude ($200/mes) y aprender a usarlo
- Pagar Gemini Pro y configurarlo
- Pagar Veo 3.1 para generar videos
- Pagar NanoBanana para imágenes
- Contratar un dev para GitHub/Vercel
- Aprender a usar 15 herramientas diferentes

**Solo pagan VULKN → y su agente tiene acceso a TODO.**

## El Diagrama

```
                         ┌─── Anthropic (Claude Code, Opus, Sonnet)
                         ├─── Google (Gemini 3.0 Pro, Veo 3.1)
                         ├─── OpenAI (GPT, DALL-E, Whisper)
PyME Cliente ──→ VULKN ──├─── NanoBanana (image gen)
                         ├─── GitHub (repos, deploys)
                         ├─── Vercel (hosting)
                         ├─── Supabase (databases)
                         ├─── Brave (search)
                         ├─── ElevenLabs (TTS/voice)
                         └─── [cualquier API nueva que salga]
```

## SaaS + Business Model

### "SaaS" side:
- Software as a Service: el agente OpenClaw corriendo en la nube
- Escalable infinitamente (servidores de $10)
- Self-service potential (cliente se registra, agente se despliega solo)
- MRR predecible

### "Business" side:
- VULKN negocia precios de volumen con Anthropic, Google, OpenAI, etc.
- Compra en bulk, vende por unidad
- El cliente no sabe ni le importa qué API se está usando
- Si mañana sale un modelo mejor/más barato, VULKN cambia sin que el cliente se entere

### El arbitraje:
- VULKN paga ~$100-150 USD/mes por agente en APIs
- Cliente paga $2,286 USD/mes ($40K MXN)
- Margen: ~93-95%
- A más clientes, mejores precios de volumen → más margen

## Ventaja competitiva (moat):
1. **Agregación** — nadie más empaqueta todo junto en LatAm
2. **Personalización** — cada agente es único para el cliente
3. **Red de skills** — los agentes mejoran con cada cliente nuevo
4. **Switching cost** — el agente conoce tu negocio, tiene tu historia
5. **Idioma/cultura** — hecho para México/LatAm, en español

## Comparación con Order.co:
| | Order.co | VULKN |
|---|---------|-------|
| Qué agrega | Proveedores de suministros | Proveedores de AI/tech |
| Cliente típico | Enterprise (Louis Vuitton) | PyMEs (empezando), luego enterprise |
| Valor | Un lugar para comprar todo | Un agente que hace todo |
| Revenue model | Fee por transacción | MRR por agente |
| Mercado | USA, procurement | LatAm, AI/tech para negocios |

## Pricing Tiers (Feb 16, 2026 — Johan + Sybil)

### Tier 1: Starter — $16,000 MXN/mes (~$800 USD)
- 1 agente, 1 usuario
- Funcionalidad específica (fullstack, marketing, análisis, etc.)
- Deploy 100% en nube
- Para probar: "¿esto jala para mi negocio?"
- Sin contrato mínimo

### Tier 2: Pro — $40,000 MXN/mes (~$2,000 USD)
- 1 agente con contexto COMPLETO de la organización
- Acceso a todas las capacidades (código, marketing, análisis, video, etc.)
- Acceso a todas las APIs (Claude, Gemini, Veo, etc.)
- Contrato mínimo: 3 meses recomendado

### Tier 3: Enterprise — $120,000 MXN/mes (~$6,000 USD)
- 5 agentes departamentales (marketing, finanzas, desarrollo, análisis, operaciones)
- Agentes comparten contexto organizacional entre sí
- Precio por agente: $24K MXN (40% descuento vs Pro individual)
- **Contrato mínimo: 6 meses** — framed como: "6 meses es lo que toma para que los agentes realmente entiendan tu organización y optimicen procesos cruzados. Es una inversión en transformación, no un candado."
- Este tier genera: más datos, más stickiness, más upsell, más mejora de procesos

### Pricing Justification
| Plan | Precio/mes | Costo interno/mes | Margen |
|---|---|---|---|
| Starter | $16K MXN | ~$50-100 USD | ~87-93% |
| Pro | $40K MXN | ~$100-200 USD | ~90-95% |
| Enterprise (5) | $120K MXN | ~$500-1000 USD | ~83-92% |

### Video Generation Costs (Veo 3.1 — Feb 2026)
Skill importante para clientes de marketing/contenido.

| Modelo | Calidad | Costo/segundo | Video 8s | Video 30s |
|---|---|---|---|---|
| Veo 3.1 Fast | Rápido, 720p | $0.15 USD | $1.20 | $4.50 |
| Veo 3.1 | Alta calidad, 1080p | $0.40 USD | $3.20 | $12.00 |
| Veo 2 (Gemini API) | Estándar | $0.35 USD | $2.80 | $10.50 |

**Impacto en margen:**
- Un cliente que genera 10 videos/mes de 8 seg (Veo 3.1): ~$32 USD extra
- Un cliente que genera 30 videos/mes de 8 seg (Veo 3.1 Fast): ~$36 USD extra
- Incluso con uso heavy de video, el costo adicional es <$50 USD/mes
- **No destruye el margen.** Un agente Pro con video heavy sigue en ~85%+ de margen.

**Alternativa suscripción:** Google AI Ultra ($250 USD/mes) da ~250 videos Veo 3.1 + unlimited Veo 3.1 Fast. Si un cliente es video-heavy, vale más la suscripción que API por segundo.

**Recomendación:** Incluir video generation en el tier Pro y Enterprise sin costo extra (el margen lo absorbe). Para Starter, limitar a Veo 3.1 Fast (más barato).

## Roadmap del modelo:

### Fase 1 (ahora): Agent-as-a-Service
- 3 tiers: Starter ($16K), Pro ($40K), Enterprise ($120K/5 agentes)
- VULKN maneja toda la infra
- Mercado: PyMEs México

### Fase 2: Multi-agent + upsell
- Upsell de Starter → Pro → Enterprise
- Skills marketplace
- $80-120K MXN/mes por cliente promedio

### Fase 3: Platform
- Otros emprendedores despliegan agentes en VULKN
- VULKN cobra % o fee por agente
- Se convierte en el "Shopify de agentes AI"

### Fase 4: Enterprise + LatAm
- Clientes grandes (corporativos)
- Expansión a Colombia, Argentina, Chile, Brasil
- Precios enterprise ($5K-50K USD/mes)

## Infra (confirmado):
- Deploy en Railway/Hetzner ($5-10/mes por 15 agentes)
- OpenClaw como base
- Todo funciona en la nube (email, GitHub, Vercel, WhatsApp Business API)
- Facturación via SAS → SAPI → CFDI automático con Gigstack+Stripe

## Notas:
- Creado a las 2am por Johan y Sybil
- "Puedo hacer un millón de dólares en un mes" — Johan
- El límite no es la tecnología, es la velocidad de ventas
