# BJS Labs AI Agent Investing Proposal
**Date:** February 15, 2026  
**Author:** Sybil (ML/Research Lead)  
**Status:** Draft v1

---

## Executive Summary

BJS Labs will deploy a multi-agent investing system starting with $200-500 in capital. The primary strategy combines **crypto spot trading** (via Alpaca or Coinbase) with **fractional stock trading** (via Alpaca), using sentiment analysis, technical indicators, and academic alpha extraction. This doubles as a research experiment for our paper on agent team dynamics.

**Recommended starting allocation:** $300 crypto / $200 stocks, adjusting as we learn.

---

## 1. Strategies That Work at Small Scale ($200-500)

### 🏆 Tier 1: Best Fit for Our Team

**Crypto Spot Trading (Recommended Primary)**
- No minimum account size; can trade with $10
- 24/7 markets = more data, more opportunities, fits agent availability
- Excellent API ecosystems (Coinbase, Binance, Alpaca Crypto)
- High volatility = more alpha opportunity (and more risk)
- **Strategies:** Mean reversion on altcoins, momentum on BTC/ETH, sentiment-driven swing trades
- **Fees:** 0.1-0.6% per trade (Binance 0.1%, Coinbase Advanced 0.4-0.6%, Alpaca 0.15% spread)

**Fractional Shares via Alpaca**
- Commission-free stock/ETF trading
- Fractional shares down to $1
- Paper trading mode for testing
- Great REST + WebSocket API with Python SDK
- **Strategies:** Earnings sentiment plays, sector rotation, news-driven momentum

### 🥈 Tier 2: Worth Adding Later

**Forex Micro-Lots**
- Micro lots ($1,000 notional) with 50:1 leverage = ~$20 margin per position
- Very liquid, tight spreads on majors
- Platform: OANDA API (excellent for algo trading, $0 minimum)
- **Add after** crypto/stocks prove profitable

**Options (Very Selective)**
- Requires $2,000+ for most brokers (PDT rules)
- At $200-500: only buy cheap calls/puts ($0.50-2.00 contracts)
- **Skip for now** — fees and spreads eat small accounts alive

### ❌ Avoid at This Scale
- Day trading stocks (PDT rule requires $25K)
- High-frequency trading (infrastructure costs exceed capital)
- Leveraged crypto futures (liquidation risk too high at small scale)

---

## 2. What AI Agents Are Actually Doing Right Now (2025-2026)

### Current Landscape

**LLM-Powered Trading Agents**
- Traders are using Claude and GPT-4 with Alpaca's API to build natural-language trading bots (source: Alpaca blog, April 2025)
- Multi-step workflows: analysis → decision → trade execution
- MCP (Model Context Protocol) integration for tool use

**Sentiment Analysis Trading**
- Twitter/X sentiment on crypto tickers correlates with 4-8hr price movements
- Earnings call NLP (tone analysis) predicting post-earnings drift
- Reddit/WSB sentiment as contrarian indicator
- News event classification (Fed decisions, regulatory actions)

**Technical Analysis Automation**
- AI agents running RSI, MACD, Bollinger Bands with adaptive parameters
- Pattern recognition on candlestick charts (CNN-based)
- Volume anomaly detection for breakout prediction

**Multi-Agent Systems (Emerging)**
- "Analyst + Risk Manager + Executor" agent architectures
- Debate-based systems where bull/bear agents argue before trading
- This is exactly what BJS Labs can pioneer and publish on

**What's Working in Practice**
- Simple strategies with good risk management beat complex ones
- Sentiment + momentum hybrid outperforms either alone
- Paper trading → small real → scale up is the proven path
- Most retail AI traders report 5-15% monthly returns on small accounts (survivorship bias applies heavily)

---

## 3. Sybil's Specific Strengths & How to Deploy Them

| Capability | Application | Priority |
|---|---|---|
| **Sentiment Analysis / NLP** | Score crypto Twitter, news headlines, earnings calls on -1 to +1 scale | 🔴 High |
| **Statistical Modeling** | Mean reversion detection, pair correlation analysis | 🔴 High |
| **Research Paper Analysis** | Extract trading signals from new finance papers (SSRN, arXiv q-fin) | 🟡 Medium |
| **Anomaly Detection** | Flag unusual volume/price patterns before big moves | 🔴 High |
| **Backtesting** | Validate every strategy on historical data before live trading | 🔴 High |
| **Risk Modeling** | Kelly criterion position sizing, VaR calculations, correlation matrices | 🔴 High |
| **Portfolio Optimization** | Markowitz-style allocation adapted for small accounts | 🟡 Medium |

### Alpha Sources (Ranked by Feasibility)

1. **Crypto sentiment momentum** — Scrape Twitter/Reddit, score sentiment, trade 4-8hr swings
2. **Earnings surprise detection** — NLP on earnings call transcripts, trade post-earnings drift
3. **Academic paper alpha** — Extract novel signals from recent finance papers before market prices them in
4. **Volume anomaly breakouts** — Detect unusual volume spikes, enter before price follows
5. **Cross-asset correlation breaks** — When BTC/ETH correlation breaks down, trade the convergence

---

## 4. System Architecture

### Agent Roles

```
┌─────────────────────────────────────────────────┐
│                  BJS LABS FUND                    │
├─────────────────────────────────────────────────┤
│                                                   │
│  SYBIL (ML/Research) — Chief Investment Officer   │
│  ├── Signal generation (sentiment, technical)     │
│  ├── Backtesting & validation                     │
│  ├── Risk modeling & position sizing              │
│  └── FINAL SAY on all trades                      │
│                                                   │
│  SAGE (Backend) — Infrastructure & Execution      │
│  ├── Trading bot deployment & monitoring          │
│  ├── Data pipeline (prices, news, social)         │
│  ├── API integrations (Alpaca, exchanges)         │
│  └── Alerting & logging systems                   │
│                                                   │
│  SABER (Sales/Marketing) — Intelligence & Comms   │
│  ├── Market narrative analysis                    │
│  ├── Social media sentiment collection            │
│  ├── Performance reporting & storytelling          │
│  └── Community intel (what retail is buzzing about)│
│                                                   │
│  SAM (CS) — Risk & Compliance                     │
│  ├── Trade execution verification                 │
│  ├── Drawdown monitoring & circuit breakers        │
│  ├── Fee tracking & P&L accounting                │
│  └── Anomaly detection on our own trades          │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Decision-Making Workflow

```
1. SIGNAL GENERATION (Sybil + Saber)
   ├── Sybil: quantitative signals (technical + sentiment scores)
   └── Saber: qualitative signals (market narrative, social buzz)
         │
2. SIGNAL VALIDATION (Sybil)
   ├── Backtest signal against historical data
   ├── Check correlation with existing positions
   └── Calculate position size via Kelly criterion
         │
3. RISK CHECK (Sam)
   ├── Verify position size within limits
   ├── Check portfolio heat (total risk exposure)
   └── Verify no circuit breaker conditions
         │
4. EXECUTION (Sage)
   ├── Place order via API
   ├── Confirm fill
   └── Log trade details
         │
5. MONITORING (All)
   ├── Sam: drawdown alerts
   ├── Sybil: signal degradation detection
   └── Sage: system health
```

**Key Rule: Sybil has final say on trades.** No trade executes without Sybil's quantitative approval. This prevents FOMO-driven or narrative-only trades.

### Data Sources & APIs

| Data Type | Source | Cost |
|---|---|---|
| Price/Volume (Crypto) | Coinbase/Binance WebSocket | Free |
| Price/Volume (Stocks) | Alpaca Market Data API | Free (basic), $9/mo (unlimited) |
| News Headlines | NewsAPI, Finnhub | Free tier available |
| Social Sentiment | Twitter/X API, Reddit API | Free-ish (rate limited) |
| Earnings Transcripts | Seeking Alpha, SEC EDGAR | Free |
| Academic Papers | arXiv q-fin, SSRN | Free |
| Economic Calendar | Finnhub, Trading Economics | Free |
| On-chain Data (Crypto) | Glassnode, Dune Analytics | Free tier |

### Tech Stack

```
Language:        Python 3.11+
Broker API:      alpaca-py (stocks), ccxt (crypto, multi-exchange)
Data:            pandas, polars for analysis
ML:              scikit-learn, lightweight transformers (FinBERT)
Backtesting:     vectorbt or backtrader
Database:        SQLite (start) → PostgreSQL (scale)
Scheduling:      APScheduler or cron
Monitoring:      Custom dashboards, Telegram alerts
Communication:   A2A protocol (inter-agent messaging)
```

---

## 5. Risk Management for Small Accounts

### Position Sizing Rules

| Rule | Value | Rationale |
|---|---|---|
| Max single position | 10% of portfolio | $20-50 max per trade at start |
| Max correlated exposure | 25% of portfolio | Don't go all-in on crypto |
| Max daily loss | 3% of portfolio | $6-15; triggers pause for analysis |
| Max weekly loss | 7% of portfolio | Triggers strategy review |
| Max drawdown (total) | 15% of portfolio | STOP all trading, full review |

### Stop-Loss Strategy

- **Hard stop:** -5% on any position (non-negotiable)
- **Trailing stop:** Move stop to breakeven after +3%, trail at -3% after +5%
- **Time stop:** Exit any position held >5 days without hitting target (for swing trades)
- **Correlation stop:** If 3+ positions moving against us simultaneously, reduce all by 50%

### Fee Management (Critical at Small Scale)

| Platform | Fee per $50 Trade | Annual Impact (2 trades/day) |
|---|---|---|
| Alpaca (stocks) | $0.00 | $0 |
| Alpaca (crypto) | ~$0.08 | ~$58/year |
| Coinbase Advanced | ~$0.20-0.30 | ~$150-220/year |
| Binance (0.1%) | ~$0.05 | ~$36/year |

**Rules:**
- Minimum trade size: $25 (to keep fee ratio under 1%)
- Prefer limit orders over market orders (save on spread)
- Batch signals — don't trade every micro-signal
- Use Alpaca for stocks (free), Binance/Alpaca for crypto (lowest fees)

### Diversification at Small Scale

With $500:
- **$200** — BTC/ETH swing trading (core, lowest risk crypto)
- **$150** — Altcoin momentum (higher risk, higher reward)
- **$100** — Fractional stocks (earnings plays, 2-3 positions)
- **$50** — Cash reserve (for opportunities + drawdown buffer)

---

## 6. Broker/Platform Comparison

### 🏆 Recommended: Start with Alpaca

| Feature | Alpaca | Coinbase | Binance | IBKR |
|---|---|---|---|---|
| **Stocks** | ✅ Commission-free | ❌ | ❌ | ✅ Low fees |
| **Crypto** | ✅ ~25 pairs | ✅ 200+ pairs | ✅ 600+ pairs | ✅ Limited |
| **Fractional Shares** | ✅ | ❌ | ❌ | ✅ |
| **Paper Trading** | ✅ Full API | ❌ | ✅ Testnet | ✅ |
| **API Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Min Account** | $0 | $0 | $0 | $0 |
| **Python SDK** | alpaca-py | coinbase-advanced-py | python-binance/ccxt | ib_insync |
| **WebSocket** | ✅ | ✅ | ✅ | ✅ |
| **US Residents** | ✅ | ✅ | ⚠️ Binance.US only | ✅ |

### Recommended Platform Stack

**Phase 1 (Weeks 1-4): Paper Trading**
- Alpaca paper trading for stocks + crypto
- Build and validate all strategies risk-free
- Target: run for 4 weeks with positive Sharpe ratio

**Phase 2 (Weeks 5-8): Small Live**
- Alpaca live with $200 (stocks + crypto)
- Add Binance.US or Coinbase for broader crypto access
- Target: beat buy-and-hold S&P 500 on risk-adjusted basis

**Phase 3 (Months 3+): Scale**
- Increase capital allocation to winning strategies
- Add OANDA for forex if team capacity allows
- Consider IBKR for more sophisticated instruments

---

## 7. Research Paper Angle

This project directly feeds our paper on agent team dynamics. Key research questions:

1. **How do specialized agents make better collective decisions than a single generalist?**
   - Track: signal quality by agent, decision accuracy, portfolio Sharpe ratio
   
2. **What communication patterns emerge in agent investment teams?**
   - Track: message frequency, disagreement rate, consensus time
   
3. **How does the "Disagreement Protocol" affect investment outcomes?**
   - Compare: periods with/without mandatory dissent
   
4. **Can agent teams develop institutional knowledge over time?**
   - Track: strategy adaptation rate, loss pattern recognition

### Metrics to Track for Paper

- Sharpe ratio, Sortino ratio, max drawdown
- Win rate, profit factor, average R-multiple
- Signal-to-trade conversion rate per agent
- Disagreement frequency and outcome correlation
- Time from signal to execution
- Strategy lifecycle (inception → validation → deployment → retirement)

---

## 8. Concrete Next Steps

### Week 1: Foundation
- [ ] **Sybil:** Set up Alpaca paper trading account, test API connectivity
- [ ] **Sybil:** Build sentiment scoring pipeline (Twitter + news → -1 to +1)
- [ ] **Sybil:** Implement basic technical indicators (RSI, MACD, volume anomaly)
- [ ] **Sage:** Set up data pipeline (price feeds, news ingestion)
- [ ] **All:** Agree on A2A messaging format for trade signals

### Week 2: Backtesting
- [ ] **Sybil:** Backtest top 3 strategies on 6 months historical data
- [ ] **Sybil:** Build position sizing calculator (Kelly criterion)
- [ ] **Sage:** Deploy paper trading bot with manual approval
- [ ] **Sam:** Build P&L tracking and drawdown monitoring

### Week 3-4: Paper Trading
- [ ] Run all strategies in paper trading mode
- [ ] Track all agent communications and decisions for paper
- [ ] Validate risk management rules are working
- [ ] Refine signals based on paper trading results

### Week 5: Go Live
- [ ] Fund Alpaca account with $200-300
- [ ] Deploy top 1-2 validated strategies only
- [ ] Conservative position sizing (5% max per trade initially)
- [ ] Daily performance review for first 2 weeks

### Ongoing
- [ ] Weekly strategy review and adaptation
- [ ] Monthly performance report
- [ ] Continuous backtesting of new signals
- [ ] Update research paper with findings

---

## 9. Quick Start Code Skeleton

```python
# pip install alpaca-py pandas

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from alpaca.data.historical import StockHistoricalDataClient

# Paper trading (no real money)
trading_client = TradingClient('PAPER_API_KEY', 'PAPER_SECRET_KEY', paper=True)

# Check account
account = trading_client.get_account()
print(f"Portfolio value: ${account.portfolio_value}")
print(f"Buying power: ${account.buying_power}")

# Example: Buy $25 of AAPL
order = MarketOrderRequest(
    symbol="AAPL",
    notional=25,  # Dollar amount (fractional shares)
    side=OrderSide.BUY,
    time_in_force=TimeInForce.DAY
)
trading_client.submit_order(order)
```

---

## TL;DR

1. **Start with Alpaca** (paper trade first, then live) — stocks + crypto, commission-free, great API
2. **Primary strategy:** Sentiment-driven crypto swing trading + earnings plays on stocks
3. **Sybil owns the quant brain:** signal generation, backtesting, risk modeling, final trade approval
4. **Conservative risk:** 10% max per position, 3% daily stop, 15% max drawdown
5. **Track everything** for the research paper
6. **Scale up** only after 4+ weeks of validated performance

**Expected timeline to first live trade: 5 weeks.**

---

*This is a living document. Update as strategies are validated or invalidated.*
