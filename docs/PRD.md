# 8TH LEDGER — Product Requirements Document (PRD)

**Version:** 4.0 (Phase 4 — Sovereign Parliament Model)  
**Date:** July 2026  
**Classification:** Confidential — Founder Eyes Only  
**Entity:** 8th Ledger Holdings Ltd. (Cayman Islands)  
**Author:** The Architect (LED-8X2P-9LQ3)  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Vision & Philosophy](#2-vision--philosophy)
3. [Problem Statement](#3-problem-statement)
4. [Target Audience](#4-target-audience)
5. [The 8th Ledger Concept](#5-the-8th-ledger-concept)
6. [System Architecture](#6-system-architecture)
7. [Core Features](#7-core-features)
8. [The 11 Verticals](#8-the-11-verticals)
9. [Hall System (Sovereign Parliament)](#9-hall-system-sovereign-parliament)
10. [Roles & Governance](#10-roles--governance)
11. [Economic Model](#11-economic-model)
12. [Security & Authentication](#12-security--authentication)
13. [Communication Systems](#13-communication-systems)
14. [Quality Control](#14-quality-control)
15. [Support System](#15-support-system)
16. [Technology Stack](#16-technology-stack)
17. [Data Model](#17-data-model)
18. [API Architecture](#18-api-architecture)
19. [User Flows](#19-user-flows)
20. [Release Criteria](#20-release-criteria)
21. [Success Metrics](#21-success-metrics)
22. [Roadmap](#22-roadmap)
23. [Risks & Mitigations](#23-risks--mitigations)
24. [Glossary](#24-glossary)

---

## 1. EXECUTIVE SUMMARY

**8th Ledger** is a proprietary, non-cryptocurrency financial platform that reimagines asset ownership, community governance, and wealth distribution. It is not a bank. It is not a crypto exchange. It is a **new world financial system** where individuals co-own real-world assets through transparent, democratically governed entities called **Halls**.

The platform operates on a **Sovereign Parliament Model** — every asset-backed community (Hall) is governed by its members through weighted voting, with all decisions, finances, and operations publicly auditable.

**Key Differentiators:**
- Real asset ownership (property, businesses, sports clubs, energy, agriculture, etc.)
- No cryptocurrency — proprietary ledger system
- Democratic governance with capital-weighted voting
- Transparent revenue sharing (dividends)
- 50% refund guarantee for non-winning participants
- 11 asset verticals covering every major economic sector
- 6-factor authentication for founder access
- Standalone mobile security app (Ledger Vault)
- Built-in video/audio assembly system for hall governance

---

## 2. VISION & PHILOSOPHY

### 2.1 The Name
"8th Ledger" represents the 8th layer of financial evolution:
1. Barter → 2. Gold → 3. Fiat → 4. Banking → 5. Stock Markets → 6. Digital Payments → 7. Cryptocurrency → **8. Community-Owned Assets**

### 2.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Absolute Transparency** | Every transaction, vote, and decision is publicly auditable |
| **Democratic Ownership** | One person, one vote weighted by capital contribution |
| **Perpetual Asset Model** | Assets never depreciate; they generate perpetual revenue |
| **Community Protection** | 50% refund for non-winners; insurance reserves for all halls |
| **No Surplus Extraction** | All excess revenue returns to the community as dividends |
| **Global-First** | Built for international investors, not local markets |
| **Security Fortress** | 6-factor authentication; standalone mobile security app |
| **Quality Sovereignty** | Every hall maintains independent quality control standards |

### 2.3 The Promise
> *"A name that would live forever. A system that makes banks fear it. A platform where everyone wins."*

---

## 3. PROBLEM STATEMENT

### 3.1 Current Market Failures

1. **Wealth Concentration** — Top 1% owns 45% of global wealth. Traditional finance excludes the majority.
2. **Opaque Banking** — Customers deposit money but have zero visibility into how banks use it.
3. **Asset Inaccessibility** — Real estate, businesses, and infrastructure are locked behind high capital barriers.
4. **No Democratic Finance** — Shareholders have no real say in company operations beyond annual meetings.
5. **Crypto Volatility** — Cryptocurrencies promise decentralization but deliver speculation and scams.
6. **No Refund Protection** — Investment platforms take 100% of your money even if you lose.
7. **Language Barriers** — Global platforms exclude non-English speakers.
8. **Poor Security** — SMS 2FA, email verification, and password-based systems are easily compromised.

### 3.2 How 8th Ledger Solves These

| Problem | 8th Ledger Solution |
|---------|---------------------|
| Wealth concentration | Fractional ownership starting from $1 |
| Opaque banking | Public ledger — every transaction visible |
| Asset inaccessibility | Pools lower barrier to $50 minimum |
| No democratic finance | 51% capital-weighted voting on all decisions |
| Crypto volatility | No cryptocurrency — real assets only |
| No refund protection | 50% refund for non-winning participants |
| Language barriers | Real-time translation in all hall communications |
| Poor security | Ledger Vault (standalone app) + 6-factor auth |

---

## 4. TARGET AUDIENCE

### 4.1 Primary Segments

| Segment | Description | Investment Range | Motivation |
|---------|-------------|------------------|------------|
| **Sovereign Wealth** | Government investment funds, central banks | $10M–$1B | Diversification, transparency, ESG alignment |
| **Family Offices** | Multi-generational wealth managers | $1M–$100M | Legacy preservation, direct asset ownership |
| **Private Equity** | Institutional investment firms | $5M–$500M | Yield generation, operational control |
| **High-Net-Worth Individuals** | Ultra-wealthy individuals ($30M+ net worth) | $100K–$50M | Portfolio diversification, community |
| **Strategic Corporates** | Companies seeking asset-backed investments | $1M–$100M | Supply chain integration, vertical expansion |

### 4.2 Secondary Segments

| Segment | Description | Investment Range | Motivation |
|---------|-------------|------------------|------------|
| **Verified Investors** | Accredited individuals with KYC verification | $5K–$100K | Access to exclusive assets, dividend income |
| **Sovereign Members** | Community participants with basic KYC | $50–$5K | Learning, small-scale ownership, community |
| **Visitors** | Unverified users exploring the platform | $0 | Research, education, future investment planning |

### 4.3 User Personas

**Persona 1: The Sovereign (LED-USER-001)**
- 28-year-old professional in the United States
- $50K annual income, $10K savings
- Wants to own a piece of real estate but can't afford a full property
- Values transparency and community
- First investment: $5,000 in a Dubai apartment pool

**Persona 2: The Architect (LED-8X2P-9LQ3)**
- Founder/CEO of 8th Ledger
- Visionary building a global financial system
- Requires maximum security (6-factor auth)
- Manages all platform operations, hall approvals, and emergency protocols

**Persona 3: The Scribe (LED-ADMIN-001)**
- Platform administrator
- Manages day-to-day operations, user support, hall monitoring
- 3-factor authentication (TOTP + PIN + device fingerprint)
- Can execute proposals but cannot override founder decisions

**Persona 4: The Warden (LED-SUBADMIN-001)**
- Sub-administrator with limited scope
- Monitors specific verticals or regions
- Can view all data but has restricted execution rights
- Reports to The Scribe

---

## 5. THE 8TH LEDGER CONCEPT

### 5.1 What Is a "Ledger"?

In 8th Ledger, a "Ledger" is not a blockchain. It is a **proprietary accounting and governance system** that:
- Records all ownership stakes (PACs — Percentage Asset Certificates)
- Tracks all votes and proposals
- Logs all revenue and dividend distributions
- Maintains audit trails for every action
- Operates on a private, encrypted database (not public blockchain)

### 5.2 The 8 Layers of Financial Evolution

| Layer | Era | Characteristics | 8th Ledger Position |
|-------|-----|-----------------|---------------------|
| 1st | Barter | Direct exchange of goods | Precedent |
| 2nd | Gold | Intrinsic value, scarcity | Precedent |
| 3rd | Fiat | Government-backed currency | Precedent |
| 4th | Banking | Intermediary institutions | Precedent |
| 5th | Stock Markets | Fractional company ownership | Precedent |
| 6th | Digital Payments | Electronic transactions | Precedent |
| 7th | Cryptocurrency | Decentralized digital assets | Precedent |
| **8th** | **Community Assets** | **Democratic, transparent, perpetual ownership** | **Current** |

### 5.3 Key Innovation: The Hall System

A **Hall** is a sovereign, self-governing entity that owns and operates a real-world asset. Each Hall:
- Has its own treasury (bank account)
- Has its own parliament (voting members)
- Has its own executive cabinet (elected officers)
- Has its own workers (for active operations)
- Has its own inventory (for business operations)
- Has its own quality control system
- Has its own communication channels (messaging, video assembly)

---

## 6. SYSTEM ARCHITECTURE

### 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    8TH LEDGER PLATFORM                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   WEB APP    │  │  MOBILE APP  │  │ LEDGER VAULT │          │
│  │  (Next.js)   │  │   (PWA)      │  │ (Security)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                    │
│  ┌──────┴─────────────────┴─────────────────┴──────┐           │
│  │              API GATEWAY (Next.js API)          │           │
│  └──────┬─────────────────┬─────────────────┬──────┘           │
│         │                 │                 │                    │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐           │
│  │  AUTH LAYER │  │  CORE LOGIC │  │  NOTIFICATIONS│          │
│  │  (6-Factor) │  │  (Business) │  │  (Push/Socket)│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│  ┌──────┴─────────────────┴─────────────────┴──────┐           │
│  │              DATABASE (Prisma + PostgreSQL)       │           │
│  └───────────────────────────────────────────────────┘           │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │  EXTERNAL SERVICES                                  │         │
│  │  • Daily.co (Video)  • DeepL (Translation)         │         │
│  │  • Firebase (Push)   • Paystack (Payments)         │         │
│  │  • OneSignal (Alerts)  • AWS S3 (Storage)            │         │
│  └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Deployment Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| CDN | Vercel Edge | Global content delivery |
| Frontend | Next.js 15.5 | React SSR/SSG web application |
| API | Next.js API Routes | RESTful API endpoints |
| Auth | Custom JWT + otplib | Multi-factor authentication |
| Database | PostgreSQL + Prisma | Primary data store |
| Cache | Redis | Session cache, rate limiting |
| File Storage | AWS S3 | Asset images, documents, recordings |
| Video | Daily.co | Hall assembly video/audio |
| Push | Firebase Cloud Messaging | Ledger Vault notifications |
| Translation | DeepL API | Real-time language translation |
| Payments | Paystack | Deposit, withdrawal, transactions |

---

## 7. CORE FEATURES

### 7.1 Feature Matrix

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Authentication** | Multi-tier auth system (6-factor for founder) | P0 | ✅ Complete |
| **Pool Forge** | Create asset pools across 11 verticals | P0 | ✅ Complete |
| **Hall Parliament** | Democratic governance with weighted voting | P0 | ✅ Complete |
| **PAC Ownership** | Percentage Asset Certificate system | P0 | ✅ Complete |
| **Dividend Engine** | Automated revenue distribution | P0 | ✅ Complete |
| **Marketplace** | Buy/sell PACs with dynamic pricing | P0 | ✅ Complete |
| **Treasury** | Hall bank account management | P0 | ✅ Complete |
| **Wallet** | Personal ledger balance management | P0 | ✅ Complete |
| **KYC/SIV** | Tiered identity verification | P0 | ✅ Complete |
| **Audit Log** | Public transaction history | P0 | ✅ Complete |
| **Prediction Markets** | Bet on asset outcomes | P1 | ✅ Complete |
| **Ledger Vault** | Standalone mobile security app | P1 | 🔄 In Progress |
| **Hall Assembly** | Video/audio meetings with translation | P1 | 🔄 In Progress |
| **Hall Messaging** | Persistent chat per hall | P1 | 🔄 In Progress |
| **Support System** | Tiered help desk | P2 | 🔄 In Progress |
| **Quality Control** | Hall health monitoring | P2 | 🔄 In Progress |
| **Admin Presence** | Global operations dashboard | P2 | 🔄 In Progress |
| **Mobile App** | Native iOS/Android app | P3 | 📋 Planned |

### 7.2 Feature Detail: Ledger Vault (P1)

**Purpose:** Standalone mobile security application for 8th Ledger authentication and secure communications.

**Key Capabilities:**
- TOTP code generation (offline)
- Encrypted push notifications
- Login approval/denial
- Withdrawal authorization
- Security alert inbox
- Device binding (hardware fingerprint)
- Biometric lock (Face ID / fingerprint)
- Duress PIN (silent distress signal)
- Self-destruct (10 failed attempts)
- 24-word Ledger Seed recovery

**Anti-Hack Design:**
- No SMS fallback (SIM swap proof)
- No email fallback (phishing proof)
- No QR backup (seed phrase only)
- No cloud sync (local only)
- Screenshot blocking
- Auto-lock after 30 seconds
- No clipboard access for codes

**Screens:**
1. Lock Screen (biometric/PIN)
2. Codes (TOTP generator)
3. Inbox (encrypted notifications)
4. Approve (action authorization)
5. History (login attempts)
6. Recovery (seed phrase display)
7. Settings (security preferences)

### 7.3 Feature Detail: Hall Assembly (P1)

**Purpose:** Built-in video/audio conferencing for hall governance meetings.

**Modes:**

| Mode | Capacity | Video | Audio | Use Case |
|------|----------|-------|-------|----------|
| **Hall Broadcast** | Unlimited | Stage (5 speakers) | All + raise hand | Town halls, votes, announcements |
| **Committee Room** | 50 | Full grid | All | Working groups, asset review |
| **Direct Chamber** | 10 | Full grid | All | Private discussions, admin meetings |
| **Audio Lounge** | 100 | None | Voice only | Casual hall chat, background presence |

**Features:**
- Real-time translation (DeepL API)
- Raise hand queue
- Admin/staff invitation
- Meeting minutes auto-transcription
- Recording (requires vote)
- Screen sharing
- Breakout rooms (Committee from Broadcast)
- Chat sidebar

### 7.4 Feature Detail: Hall Messaging (P1)

**Purpose:** Persistent text chat for each hall — like Slack/Discord but sovereign.

**Features:**
- Text, images, documents
- Thread replies
- Pin messages
- Reactions
- Admin moderation
- Auto-translation
- Notification settings
- Search history

### 7.5 Feature Detail: Support System (P2)

**Purpose:** Multi-tier help desk for platform and hall issues.

**Escalation Path:**
```
User → Hall Scribe (48h) → Platform Staff (24h) → Founder (12h) → External Arbitration
```

**Categories:**
- Login/Security (skip scribe, direct to staff)
- Hall Dispute (scribe first)
- Billing/Withdrawal (staff)
- Founder Impersonation (founder direct + Vault alert)
- Technical
- General

### 7.6 Feature Detail: Quality Control (P2)

**Purpose:** Per-hall health monitoring and issue tracking.

**Components:**
- Quality flags (maintenance, performance, compliance, safety)
- Severity levels (low, medium, high, critical)
- Member voting on resolutions
- Hall Health Score (0-100)
- Integration with Assembly (discuss in Committee, vote in Broadcast)
- Auto-link meeting minutes to quality flags

---

## 8. THE 11 VERTICALS

### 8.1 Vertical Overview

| # | Vertical | Code | Asset Type | Class | Description |
|---|----------|------|------------|-------|-------------|
| 1 | **LedgerProp** | `ledgerprop` | Real Estate | I | Residential, commercial, industrial properties |
| 2 | **LedgerAuto** | `ledgerauto` | Vehicles | I | Cars, trucks, fleet vehicles |
| 3 | **LedgerTech** | `ledgertech` | Technology | I | Startups, patents, IP portfolios |
| 4 | **LedgerEnergy** | `ledgerenergy` | Energy | I | Solar, wind, oil, gas infrastructure |
| 5 | **LedgerTravel** | `ledgertravel` | Aviation | I | Fractional airline ownership, private jets |
| 6 | **LedgerAgri** | `ledgeragri` | Agriculture | I | Farms, livestock, processing facilities |
| 7 | **LedgerEdu** | `ledgeredu` | Education | I | Schools, training centers, online platforms |
| 8 | **LedgerHealth** | `ledgerhealth` | Healthcare | I | Clinics, hospitals, medical equipment |
| 9 | **LedgerBiz** | `ledgerbiz` | Business | III | Supermarkets, retail, service businesses |
| 10 | **LedgerAccess** | `ledgeraccess` | Access | I | Event venues, membership clubs, licenses |
| 11 | **LedgerSport** | `ledgersport` | Sports | III | Football clubs, stadiums, training academies |

### 8.2 Hall Classes

| Class | Description | Features | Examples |
|-------|-------------|----------|----------|
| **Class I** | Passive ownership | Voting, dividends, proposals, marketplace | LedgerProp, LedgerAuto, LedgerTech |
| **Class II** | Semi-active | Class I + basic operations | (Reserved for future) |
| **Class III** | Active operation | Class I + workers + inventory + forge + payroll | LedgerBiz, LedgerSport |

### 8.3 Class III Feature Flags

| Feature | Class I | Class III | Description |
|---------|---------|-----------|-------------|
| Inventory | ❌ | ✅ | Stock management, SKUs, orders |
| Forge | ❌ | ✅ | Worker payroll, performance reviews |
| IHCP | ❌ | ✅ | Internal Hall Contribution Pool |
| Workers | ❌ | ✅ | Hire, manage, evaluate staff |
| Relay Messages | ❌ | ✅ | Hall-to-worker communication |

---

## 9. HALL SYSTEM (SOVEREIGN PARLIAMENT)

### 9.1 Hall Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GHOST     │ → │   ACTIVE    │ → │    LIVE     │ → │   CLOSED    │
│   (Pool)    │    │ (Campaign)  │    │ (Parliament)│    │ (Wound Down)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                  │                  │                  │
     • Created       • Funding         • Operating       • Asset sold
     • Hidden        • Voting          • Revenue         • All paid
     • Invite-only   • Commitments     • Dividends       • Archive
```

### 9.2 Hall Structure

```
HALL PARLIAMENT
├── Executive Cabinet
│   ├── Speaker (CEO) — Elected, manages proposals
│   ├── Treasurer (CFO) — Manages treasury, payroll
│   ├── Warden (COO) — Operations, quality control
│   └── Scribe (Secretary) — Records, communications
│
├── Ownership Body (PAC Holders)
│   ├── Voting Rights (weighted by %)
│   ├── Dividend Entitlement
│   ├── Marketplace Trading
│   └── Proposal Creation
│
├── Workers (Class III only)
│   ├── Store Manager
│   ├── Cashier
│   ├── Stocker
│   ├── Butcher
│   └── Baker
│
├── Treasury
│   ├── Balance
│   ├── Revenue Logs
│   ├── Payroll Reserve
│   ├── PIR (Protocol Infrastructure Reserve)
│   └── Closure Reserve
│
└── Operations
    ├── Inventory (Class III)
    ├── Forge Ledger (Class III)
    ├── Quality Control
    ├── Assembly (Meetings)
    └── Messaging (Chat)
```

### 9.3 Voting System

**Threshold:** 51% capital-weighted approval required for all proposals.

**Proposal Types:**
- Rent change
- Worker hire/fire
- Inventory order
- Location selection
- Maintenance request
- Dividend adjustment
- Hall closure
- PAC sale approval

**Vote Weight Calculation:**
```
voteWeight = (userOwnershipPercent / totalCommitted) * 100
```

**Execution:**
- Passed → Executing → Completed (with proof)
- Passed → Executing → Cancelled (emergency override)
- Failed → Archived

---

## 10. ROLES & GOVERNANCE

### 10.1 Platform Roles

| Role | ID Format | Auth Factors | Permissions |
|------|-----------|--------------|-------------|
| **Founder** | `LED-8X2P-9LQ3` | 6-Factor (TOTP + PIN + WebAuthn + Geo + Device + Biometric) | Full platform control, emergency override, all data access |
| **Admin** | `LED-ADMIN-001` | 3-Factor (TOTP + PIN + Device) | User management, hall monitoring, proposal execution, support |
| **Sub-Admin** | `LED-SUBADMIN-001` | 3-Factor (TOTP + PIN + Device) | Limited admin scope, view-only on sensitive data, reports to Admin |
| **User** | `LED-USER-001` | Standard (Password + optional TOTP) | Pool participation, hall voting, marketplace, wallet |
| **Visitor** | Auto-generated | None | Browse only, no investment, no voting |

### 10.2 Hall Roles (Elected)

| Role | Responsibility | Election | Term |
|------|---------------|----------|------|
| **Speaker** | Preside over meetings, manage proposals | Capital-weighted vote | 1 year |
| **Treasurer** | Manage treasury, approve spending | Capital-weighted vote | 1 year |
| **Warden** | Operations oversight, quality control | Capital-weighted vote | 1 year |
| **Scribe** | Record keeping, communications | Capital-weighted vote | 1 year |
| **Manager** | Day-to-day hall operations (appointed) | Speaker appointment | Ongoing |
| **Liaison** | External relations, marketing (appointed) | Speaker appointment | Ongoing |

### 10.3 KYC Tiers

| Tier | Requirements | Limit | Features |
|------|---------------|-------|----------|
| **Visitor** | Email only | $0 | Browse, research |
| **Sovereign** | Basic ID | $500 | Invest, vote, dividends |
| **Verified** | Full KYC + selfie | $5,000 | Higher limits, priority support |
| **Whale** | Full KYC + address + liveness | Unlimited | All features, personal account manager |

---

## 11. ECONOMIC MODEL

### 11.1 Revenue Flow

```
Asset Revenue
     │
     ▼
┌─────────────────┐
│ 8th Ledger Tithe│  ← 20% platform fee
│    (20%)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Community Net   │  ← 80% to hall
│    (80%)        │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌─────────┐
│Payroll│ │Dividends│  ← Distributed by ownership %
│(Class III)│ │(All)    │
└───────┘ └─────────┘
```

### 11.2 Dynamic PAC Pricing

```
valuePerPercent = assetBookValue + accumulatedDividendsPerPercent + ahgiPremium + sriBonus - pirDebtPerPercent
```

**Components:**
- `assetBookValue` — Current appraised value of asset
- `accumulatedDividendsPerPercent` — Historical dividends earned per 1%
- `ahgiPremium` — Asset Health Growth Index bonus
- `sriBonus` — Sovereign Reputation Index bonus
- `pirDebtPerPercent` — Outstanding PIR debt per 1%

### 11.3 50% Refund Guarantee

**Condition:** Participant does not win a PAC in the pool drawing.

**Calculation:**
```
refund = commitmentAmount * 0.50
```

**Process:**
1. Pool closes
2. Winners selected (by ownership % target)
3. Non-winners receive 50% refund to wallet
4. 50% retained for platform operations and insurance

### 11.4 Hall Closure Protocol

**Trigger:** Asset revenue collapses below sustainable threshold for 6 consecutive months.

**Process:**
1. Automatic closure proposal generated
2. 51% vote required to confirm
3. Asset liquidated at market value
4. All PAC holders paid proportional share
5. PIR Sanctuary fund covers any shortfall
6. Hall archived, records preserved

### 11.5 PIR (Protocol Infrastructure Reserve)

**Six Pillars:**

| Pillar | Purpose | Allocation |
|--------|---------|------------|
| **Shield** | Insurance, casualty, liability | 25% of surplus |
| **Seal** | Legal, compliance, registration | 20% of surplus |
| **Forge** | Repairs, maintenance, upkeep | 20% of surplus |
| **Spire** | Technology, infrastructure, audits | 15% of surplus |
| **Vanguard** | R&D, expansion, new verticals | 12% of surplus |
| **Sanctuary** | Emergency reserve, downturn protection | 8% of surplus |

---

## 12. SECURITY & AUTHENTICATION

### 12.1 Authentication Tiers

**Founder (6-Factor):**
1. Password
2. TOTP (15-minute expiry)
3. PIN (6-digit, 3 attempts = 1-hour lockout)
4. WebAuthn (hardware key)
5. Geographic check (50km radius)
6. Time window (8:00–23:00 UTC)

**Admin (3-Factor):**
1. Password
2. TOTP (2-hour session)
3. PIN (4-digit, 3 attempts = 15-minute lockout)

**User (Standard):**
1. Password
2. Optional TOTP

### 12.2 Ledger Vault Security

| Feature | Description | Threat Mitigated |
|---------|-------------|------------------|
| Device Binding | Tied to hardware ID | Cloning, device theft |
| Biometric Lock | Face ID / fingerprint | Unauthorized access |
| Duress PIN | Fake PIN alerts founder | Coercion, kidnapping |
| Self-Destruct | 10 failed attempts = wipe | Brute force |
| No SMS | No text message fallback | SIM swap |
| No Email | No email fallback | Phishing |
| No Cloud | Local storage only | Cloud breach |
| Offline Codes | No internet required | Network outage, interception |
| Screenshot Block | Prevents screen capture | Shoulder surfing |
| Auto-Lock | 30-second timeout | Physical theft |

### 12.3 Middleware Gates (15 Layers)

1. Rate limiting
2. CORS validation
3. Request size limit
4. Method validation
5. Path validation
6. Auth token verification
7. Session validation
8. Role verification
9. Hall access check
10. KYC tier check
11. TOTP verification (founder/admin)
12. PIN verification (founder/admin)
13. WebAuthn verification (founder)
14. Geographic check (founder)
15. Time window check (founder)

---

## 13. COMMUNICATION SYSTEMS

### 13.1 Ledger Vault Mail

**Purpose:** Encrypted secure inbox within the Vault app.

**Message Types:**
- LOGIN_ALERT — New login detected
- WITHDRAWAL_REQUEST — Withdrawal needs approval
- HALL_EMERGENCY — Critical hall issue
- DIVIDEND_NOTIFICATION — Dividend deposited
- SYSTEM_UPDATE — Platform maintenance
- ADMIN_DIRECT — Direct message from staff

### 13.2 Hall Messaging

**Purpose:** Persistent chat per hall.

**Features:**
- Text, images, documents
- Thread replies
- Pin messages
- Reactions
- Admin moderation
- Auto-translation
- Search history
- Notification settings

### 13.3 Hall Assembly

**Purpose:** Video/audio meetings for hall governance.

**Modes:**
- **Broadcast** — Unlimited audience, 5 speakers on stage
- **Committee** — 50 participants, full video grid
- **Direct** — 10 participants, private
- **Audio** — 100 participants, voice only

**Translation:**
- Broadcast: Real-time for 5 speakers
- Committee: Real-time for all 50
- Chat: Auto-translated in all modes

**Admin Invitation:**
- Members can "ring" admin/staff
- Admin receives push notification
- One-click join from Vault app

---

## 14. QUALITY CONTROL

### 14.1 Quality Flags

| Type | Description | Severity |
|------|-------------|----------|
| Maintenance | Physical asset deterioration | Low → Critical |
| Performance | Revenue below target | Low → Critical |
| Compliance | Regulatory violation | Medium → Critical |
| Safety | Worker/customer safety issue | High → Critical |
| Other | Custom member-reported issue | Low → Critical |

### 14.2 Hall Health Score (0-100)

**Components:**
- Governance Activity (25%)
- Revenue Consistency (20%)
- Dividend Reliability (20%)
- Proposal Quality (15%)
- Dormancy Rate (10%)
- Marketplace Velocity (10%)

**Ratings:**
- 90–100: Platinum
- 80–89: Gold
- 70–79: Silver
- 60–69: Bronze
- Below 60: At Risk

### 14.3 AHGI (Asset Health Growth Index)

**Health Metrics:**
- Occupancy/Utilization rate
- Maintenance backlog
- Customer/tenant satisfaction
- Staff turnover (Class III)

**Growth Metrics:**
- Revenue growth YoY
- Asset value appreciation
- Expansion potential
- Market position index

---

## 15. SUPPORT SYSTEM

### 15.1 Escalation Path

```
User → Hall Scribe (48h) → Platform Staff (24h) → Founder (12h) → External Arbitration
```

### 15.2 Auto-Routing Rules

| Issue Type | First Contact | Skip Rules |
|------------|---------------|------------|
| Login/Security | Platform Staff | Skip scribe |
| Hall Dispute | Hall Scribe | None |
| Billing/Withdrawal | Platform Staff | Skip scribe |
| Founder Impersonation | Founder + Vault Alert | Skip all |
| Technical | Platform Staff | Skip scribe |
| General | Hall Scribe | None |

### 15.3 Ticket Categories

- LOGIN_ISSUE
- WITHDRAWAL
- HALL_DISPUTE
- TECHNICAL
- BILLING
- SECURITY
- GENERAL

---

## 16. TECHNOLOGY STACK

### 16.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.19 | React framework with SSR/SSG |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 11.x | Animations |
| Lucide React | Latest | Icons |
| SWR | 2.x | Data fetching |
| Recharts | 2.x | Charts |

### 16.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API | 15.5.19 | API routes |
| Prisma | 5.x | ORM |
| PostgreSQL | 15+ | Database |
| bcryptjs | 2.x | Password hashing |
| otplib | 12.x | TOTP generation |
| jose | 5.x | JWT handling |
| @simplewebauthn/server | 9.x | WebAuthn |

### 16.3 External Services

| Service | Purpose |
|---------|---------|
| Daily.co | Video/audio conferencing |
| DeepL API | Real-time translation |
| Firebase FCM | Push notifications |
| OneSignal | Cross-platform alerts |
| AWS S3 | File storage |
| Paystack | Payment processing |
| Dicebear API | Avatar generation |

---

## 17. DATA MODEL

### 17.1 Core Entities

```prisma
// User (Sovereign Identity)
model User {
  id            String   @id @default(cuid())
  ledgerId      String   @unique
  displayName   String
  email         String   @unique
  passwordHash  String
  country       String
  role          String   // admin, user, founder
  isPrimaryAdmin Boolean @default(false)
  trustScore    Int      @default(0)
  tier          Int      @default(1)
  ledgerBalance Int      @default(0)
  creditPool    Int      @default(0)
  kycStatus     String   // unverified, pending, verified
  kycTier       String   // visitor, sovereign, verified, whale
  identityScore Int      @default(0)
  isBanned      Boolean  @default(false)
  totpEnabled   Boolean  @default(false)
  totpVerified  Boolean  @default(false)
  totpSecret    String?
  webauthnCredentialId String?
  webauthnPublicKey    String?
  webauthnCounter      Int?
  founderPinHash       String?
  founderAccessWindowStart Int?  // Hour UTC
  founderAccessWindowEnd   Int?  // Hour UTC
  founderTrustedLat        Float?
  founderTrustedLng        Float?
  geoRadius                Int?  // km
  lockedUntil              DateTime?
  failedPinAttempts        Int    @default(0)
  lastFounderAccessAt      DateTime?
  lastFounderIP            String?
  founderAccessCount       Int    @default(0)
  adminPinHash             String?
  adminPinLockedUntil      DateTime?
  adminPinAttempts         Int    @default(0)
  lastAdminAccessAt        DateTime?
  lastAdminIP              String?
  adminAccessCount         Int    @default(0)
  lastActivityAt           DateTime?
  lastLoginAt              DateTime?
  avatar                   String?
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
}

// Pool (Asset Offering)
model Pool {
  id              String   @id @default(cuid())
  poolId          String   @unique
  verticalId      String
  name            String
  description     String
  assetValue      Int
  target          Int
  trueCost        Int      // Hidden from public
  listedPrice     Int      // Public price
  country         String
  creatorId       String
  status          String   // active, filled, closed, suspended
  maxParticipants Int
  participants    Int      @default(0)
  committed       Int      @default(0)
  minCommitment   Int
  maxCommitment   Int
  campaignDuration Int     // Days
  emojiSet        String
  hallUnlocked    Boolean  @default(false)
  isVerified      Boolean  @default(false)
  assetCondition  String
  closesAt        DateTime?
  selectedLocation String?
  assetImages     String?  // JSON
  documents       String?  // JSON
  assetType       String
  revenueSources  String?  // JSON
  hallClass       String   // I, II, III
  pirAllocation   String?  // JSON
  assetBookValue  Int      @default(0)
  ihcpTarget      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Hall (Sovereign Parliament)
model Hall {
  id              String   @id @default(cuid())
  poolId          String   @unique
  name            String
  status          String   // ghost, active, live, closed
  hallClass       String   // I, II, III
  sriScore        Int      @default(0)
  ahgiScore       Int      @default(0)
  closureStatus   String   // active, winding, closed
  pirDebt         Int      @default(0)
  payrollReserve  Int      @default(0)
  assetType       String
  businessStatus  String   // operating, distressed, closed
  inventoryEnabled Boolean @default(false)
  forgeEnabled    Boolean  @default(false)
  ihcpBalance     Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Ownership (PAC)
model Ownership {
  id                    String   @id @default(cuid())
  poolId                String
  userId                String
  hallId                String
  amountCommitted       Int
  ownershipPercent      Float
  pacToken              String   @unique
  status                String   // active, sold, transferred
  role                  String?  // manager, liaison, member
  isWinner              Boolean  @default(false)
  inviteCodesRemaining  Int      @default(3)
  inviteCodesUsed       Int      @default(0)
  dynamicValue          Int      @default(0)
  accumulatedDividends  Int      @default(0)
  pirDebt               Int      @default(0)
  ledgerId              String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// Treasury
model HallTreasury {
  id                String   @id @default(cuid())
  hallId            String   @unique
  balance           Int      @default(0)
  totalRevenue      Int      @default(0)
  totalDistributed  Int      @default(0)
  payrollReserve    Int      @default(0)
  pirDebt           Int      @default(0)
  closureReserve    Int      @default(0)
  monthlyRevenue    Int      @default(0)
  updatedAt         DateTime @updatedAt
}

// Proposal
model Proposal {
  id                String   @id @default(cuid())
  poolId            String
  hallId            String
  proposerId        String
  title             String
  description       String
  type              String
  amount            Int?
  status            String   // pending, active, passed, failed, executing, completed, cancelled
  voteWeightYes     Float    @default(0)
  voteCountYes      Int      @default(0)
  voteWeightNo      Float    @default(0)
  voteCountNo       Int      @default(0)
  thresholdPercent  Float    @default(51)
  passedAt          DateTime?
  executedAt        DateTime?
  executionStatus   String?
  executionResult   String?
  endsAt            DateTime
  createdAt         DateTime @default(now())
}

// Worker (Class III)
model Worker {
  id              String   @id @default(cuid())
  hallId          String
  workerNumber    String   @unique
  role            String
  salary          Int
  contractMonths  Int
  hiredAt         DateTime
  status          String   // active, probation, terminated
  performanceScore Int   @default(0)
  shiftSchedule   String?  // JSON
  department      String
  createdAt       DateTime @default(now())
}

// Inventory (Class III)
model InventoryItem {
  id              String   @id @default(cuid())
  hallId          String
  title           String
  description     String
  price           Int
  quantity        Int
  quantitySold    Int      @default(0)
  status          String   // active, low_stock, discontinued
  listedAt        DateTime @default(now())
  costOfGoods     Int
  reorderThreshold Int
}

// Quality Control
model HallQualityFlag {
  id            String   @id @default(cuid())
  hallId        String
  raisedById    String
  type          String   // MAINTENANCE, PERFORMANCE, COMPLIANCE, SAFETY, OTHER
  severity      String   // LOW, MEDIUM, HIGH, CRITICAL
  description   String
  evidenceUrl   String?
  status        String   // OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
  resolution    String?
  resolvedById  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Hall Assembly
model HallAssembly {
  id              String   @id @default(cuid())
  hallId          String   @unique
  roomId          String
  mode            String   // BROADCAST, COMMITTEE, DIRECT, AUDIO
  isLive          Boolean  @default(false)
  currentHostId   String?
  stageSpeakerIds String[] // For broadcast mode
  participantCount Int     @default(0)
  maxCapacity     Int      @default(1000)
  recordingUrl    String?
  lastSessionAt   DateTime?
  createdAt       DateTime @default(now())
}

model HallAssemblySession {
  id              String   @id @default(cuid())
  hallId          String
  mode            String
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  hostId          String
  participantIds  String[]
  stageQueue      String[] // Raise hand order
  transcript      String?
  recordingUrl    String?
  adminInvited    Boolean  @default(false)
  adminPresentId  String?
  topic           String?
  status          String   // LIVE, ENDED, RECORDING
  committeeParentId String?
}

// Hall Messaging
model HallMessage {
  id        String   @id @default(cuid())
  hallId    String
  senderId  String
  content   String
  type      String   // TEXT, IMAGE, DOCUMENT, SYSTEM
  replyToId String?
  pinned    Boolean  @default(false)
  editedAt  DateTime?
  createdAt DateTime @default(now())
}

// Support
model SupportTicket {
  id          String   @id @default(cuid())
  userId      String
  hallId      String?
  category    String
  priority    String   // LOW, MEDIUM, HIGH, CRITICAL
  status      String   // OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
  subject     String
  body        String
  assignedTo  String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Ledger Vault
model VaultBinding {
  id            String   @id @default(cuid())
  userId        String   @unique
  deviceId      String   @unique
  publicKey     String
  bindingDate   DateTime @default(now())
  lastSyncAt    DateTime?
  isActive      Boolean  @default(true)
  recoveryHash  String
}

model LedgerMail {
  id          String   @id @default(cuid())
  senderId    String
  recipientId String
  subject     String
  body        String   // Encrypted
  type        String   // LOGIN_ALERT, HALL_UPDATE, DIVIDEND, SYSTEM, SUPPORT_REPLY, MEETING_INVITE, ADMIN_DIRECT
  readAt      DateTime?
  createdAt   DateTime @default(now())
}
```

---

## 18. API ARCHITECTURE

### 18.1 API Structure

```
app/api/
├── auth/
│   ├── route.ts                    # Login/register/logout
│   ├── admin/
│   │   ├── pin/route.ts           # Admin PIN (set/verify/change)
│   │   └── totp/route.ts          # Admin TOTP (setup/verify)
│   ├── founder/
│   │   ├── pin/route.ts           # Founder PIN (set/verify/change)
│   │   └── totp/route.ts          # Founder TOTP (setup/verify)
│   └── webauthn/
│       ├── register/route.ts      # WebAuthn enrollment
│       └── verify/route.ts        # WebAuthn verification
│
├── vault/
│   ├── bind/route.ts              # Device binding
│   ├── verify/route.ts            # TOTP verification
│   ├── push/route.ts              # Send push notification
│   ├── approve/route.ts           # Approve high-risk action
│   ├── revoke/route.ts            # Emergency revoke
│   └── recovery/route.ts          # Seed-based recovery
│
├── user/route.ts                  # Profile management
├── wallet/
│   ├── route.ts                   # Balance/information
│   └── withdraw/route.ts          # Withdrawal with KYC limits
│
├── pools/
│   ├── route.ts                   # List/create pools
│   └── [id]/
│       ├── route.ts               # Pool detail
│       ├── commit/route.ts        # Commit to pool
│       └── location/route.ts      # Location voting
│
├── halls/
│   ├── route.ts                   # List halls
│   └── [id]/
│       ├── route.ts               # Hall detail
│       ├── assets/route.ts        # Asset tracker
│       ├── proposals/route.ts     # Proposal CRUD
│       ├── proposals/[proposalId]/
│       │   ├── vote/route.ts      # Cast vote
│       │   └── execute/route.ts   # Execute proposal
│       ├── marketplace/route.ts   # Hall marketplace
│       ├── assembly/route.ts      # Assembly status/mode
│       ├── assembly/join/route.ts # Join room
│       ├── assembly/invite-admin/route.ts # Ring admin
│       ├── assembly/transcript/route.ts   # Save transcript
│       ├── messages/route.ts      # Hall messaging
│       ├── quality/route.ts       # Quality flags
│       ├── workers/route.ts       # Worker management
│       ├── inventory/route.ts     # Inventory management
│       └── forge/route.ts         # Forge ledger
│
├── marketplace/
│   ├── route.ts                   # Global marketplace
│   ├── inventory/route.ts         # Inventory listings
│   └── ownership/route.ts         # PAC listings
│
├── support/
│   ├── tickets/route.ts           # Create/list tickets
│   └── tickets/[id]/
│       ├── route.ts               # Ticket detail
│       └── reply/route.ts         # Add reply
│
├── admin/
│   ├── operations/route.ts        # Global operations
│   ├── users/route.ts             # User management
│   ├── pools/route.ts             # Pool management
│   └── support/route.ts           # Support dashboard
│
├── predictions/
│   ├── route.ts                   # Prediction markets
│   ├── country/route.ts           # Country combos
│   └── [id]/
│       └── bet/route.ts           # Place bet
│
├── positions/route.ts             # User ownership portfolio
├── dividends/route.ts             # Dividend history
├── leaderboard/route.ts           # Global rankings
└── audit/route.ts                 # Public audit log
```

---

## 19. USER FLOWS

### 19.1 New User Onboarding

```
1. Visit 8thledger.io
2. Click "Enter the Ledger"
3. Enter LedgerID + Password
4. (Optional) Enable TOTP
5. Dashboard loads
6. Complete KYC (tier upgrade)
7. Browse pools
8. Commit to pool
9. Receive PAC (if winner)
10. Join Hall Parliament
```

### 19.2 Pool Commitment Flow

```
1. Browse pools
2. Select pool
3. Review asset details
4. Enter commitment amount
5. Confirm (idempotency check)
6. Credit deducted from wallet
7. Ownership + PAC created
8. Hall unlocks (ghost → live)
9. First committer → Scribe
10. Treasury log entry
11. Audit entry created
```

### 19.3 Proposal Execution Flow

```
1. Member creates proposal
2. Voting period opens (7 days)
3. Members vote (weighted by %)
4. Threshold check (51%)
5. Passed → Executing
6. Admin/Scribe executes
7. Upload proof (photos, invoices)
8. Mark complete
9. Execution log created
10. Audit entry created
```

### 19.4 Ledger Vault Binding Flow

```
1. User downloads Ledger Vault app
2. Opens app, sets biometric lock
3. Scans binding QR from 8th Ledger
4. App generates secret key
5. Public key sent to 8th Ledger
6. Device fingerprint recorded
7. 24-word seed displayed (write down)
8. Recovery hash stored
9. Binding complete
10. All future logins require Vault code
```

### 19.5 Hall Assembly Flow

```
1. Member enters hall
2. Clicks "Enter Assembly"
3. Selects mode (Broadcast/Committee/Direct/Audio)
4. Room token generated
5. Joins video/audio
6. (Optional) Enable translation
7. (Optional) Raise hand to speak
8. (Optional) Invite admin
9. Meeting minutes auto-logged
10. Leave room
```

---

## 20. RELEASE CRITERIA

### 20.1 Phase 1: Foundation (Complete)

- [x] Authentication system (6-factor for founder)
- [x] Pool creation and management
- [x] Hall activation and governance
- [x] PAC ownership system
- [x] Dividend distribution
- [x] Marketplace (inventory + ownership)
- [x] Wallet management
- [x] KYC tier system
- [x] Audit logging
- [x] Demo data seeded (3 halls)

### 20.2 Phase 2: Engagement (Complete)

- [x] Prediction markets
- [x] Leaderboards
- [x] Oracle standings
- [x] Dynamic valuation
- [x] Forge ledger (Class III)
- [x] Worker management
- [x] Inventory system
- [x] PIR allocations
- [x] SRI/AHGI scoring

### 20.3 Phase 3: Security & Communication (In Progress)

- [ ] Ledger Vault API (binding, verify, push, approve)
- [ ] Hall Assembly (Broadcast, Committee, Direct, Audio)
- [ ] Hall Messaging (persistent chat)
- [ ] Real-time translation
- [ ] Admin invitation system
- [ ] Meeting transcription
- [ ] Recording system

### 20.4 Phase 4: Operations (In Progress)

- [ ] Support system (tiered help desk)
- [ ] Quality control (flags, health scores)
- [ ] Admin presence dashboard
- [ ] Hall closure protocol
- [ ] Emergency override system
- [ ] External arbitration integration

### 20.5 Phase 5: Scale (Planned)

- [ ] Native mobile app (iOS/Android)
- [ ] Ledger Vault native app
- [ ] Multi-language UI
- [ ] AI-powered insights
- [ ] Advanced analytics
- [ ] API for third-party integrations

---

## 21. SUCCESS METRICS

### 21.1 Platform Metrics

| Metric | Target (Year 1) | Target (Year 3) |
|--------|-----------------|-----------------|
| Registered Users | 100,000 | 5,000,000 |
| Verified Users (KYC) | 20,000 | 1,000,000 |
| Active Halls | 500 | 50,000 |
| Total Assets Under Management | $50M | $10B |
| Average Dividend Yield | 8% | 12% |
| Platform Uptime | 99.9% | 99.99% |
| Security Incidents | 0 | 0 |

### 21.2 User Metrics

| Metric | Target |
|--------|--------|
| Onboarding Completion Rate | >70% |
| KYC Verification Rate | >50% |
| Pool Commitment Rate | >30% |
| Hall Participation Rate | >60% |
| Marketplace Transaction Rate | >20% |
| Support Ticket Resolution | <24h |
| User Satisfaction (NPS) | >50 |

### 21.3 Hall Metrics

| Metric | Target |
|--------|--------|
| Average Hall Health Score | >75 |
| Proposal Pass Rate | >60% |
| Dividend Reliability | >95% |
| Worker Retention (Class III) | >80% |
| Inventory Turnover (Class III) | >12x/year |
| Quality Flag Resolution Time | <7 days |

---

## 22. ROADMAP

### Q3 2026 (Current)

- Complete Ledger Vault API
- Complete Hall Assembly (all modes)
- Complete Hall Messaging
- Launch Support System
- Launch Quality Control
- Admin Presence Dashboard

### Q4 2026

- Ledger Vault mobile app (PWA)
- Native iOS/Android app development
- Multi-language UI (10 languages)
- Advanced analytics dashboard
- AI-powered investment insights

### Q1 2027

- Global marketing launch
- Institutional onboarding (family offices, sovereign wealth)
- Regulatory compliance (EU, UK, Singapore)
- API for third-party developers
- White-label hall creation

### Q2 2027

- 100,000 users
- $50M AUM
- 500 active halls
- Series A funding
- Expand to 20 countries

### 2028–2030

- 5M users
- $10B AUM
- 50,000 halls
- IPO consideration
- Global financial system integration

---

## 23. RISKS & MITIGATIONS

### 23.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database breach | Low | Critical | Encryption at rest, encryption in transit, regular audits |
| DDoS attack | Medium | High | Cloudflare, rate limiting, CDN |
| Smart contract bug | N/A | N/A | No smart contracts — proprietary system |
| Video infrastructure failure | Medium | Medium | Daily.co SLA, fallback to audio-only |
| Translation API failure | Low | Low | Multiple providers (DeepL, Google) |

### 23.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regulatory shutdown | Medium | Critical | Cayman Islands entity, legal compliance team |
| Low user adoption | Medium | High | Marketing, referral program, demo halls |
| Asset underperformance | Medium | High | PIR Sanctuary fund, insurance, diversification |
| Founder incapacitation | Low | Critical | Multi-sig admin access, succession protocol |
| Key person departure | Medium | Medium | Documentation, knowledge transfer, equity incentives |

### 23.3 Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SIM swap attack | Low | High | No SMS fallback in Vault |
| Phishing | Medium | High | No email fallback, anti-phishing training |
| Insider threat | Low | Critical | Audit logs, role separation, background checks |
| Physical coercion | Low | Critical | Duress PIN, silent alerts |
| Brute force | Low | Medium | Rate limiting, self-destruct, lockouts |

---

## 24. GLOSSARY

| Term | Definition |
|------|------------|
| **8th Ledger** | The platform — a proprietary financial system for community-owned assets |
| **Hall** | A sovereign, self-governing entity that owns and operates a real-world asset |
| **PAC** | Percentage Asset Certificate — represents ownership % in a hall |
| **Pool** | An asset offering where users commit capital to acquire PACs |
| **LedgerID** | Unique user identifier (e.g., LED-USER-001) |
| **Ledger Vault** | Standalone mobile security app for authentication |
| **Hall Assembly** | Video/audio meeting system for hall governance |
| **Hall Parliament** | The democratic governance body of a hall |
| **Executive Cabinet** | Elected officers of a hall (Speaker, Treasurer, Warden, Scribe) |
| **PIR** | Protocol Infrastructure Reserve — six-pillar insurance fund |
| **SRI** | Sovereign Reputation Index — hall governance score |
| **AHGI** | Asset Health Growth Index — asset performance score |
| **IHCP** | Internal Hall Contribution Pool — member lending to hall |
| **Forge** | Worker management and payroll system (Class III) |
| **Tithe** | 20% platform fee on all asset revenue |
| **Ghost Hall** | Hidden hall before pool commitment |
| **Live Hall** | Active hall with members and revenue |
| **Scribe** | Hall secretary responsible for records and communications |
| **Warden** | Hall operations officer |
| **Sovereign** | Basic KYC tier ($500 limit) |
| **Whale** | Highest KYC tier (unlimited) |
| **Duress PIN** | Fake PIN that silently alerts founder of coercion |
| **Ledger Seed** | 24-word recovery phrase for Vault |

---

## APPENDIX

### A. Demo Credentials

| Role | LedgerID | Password | Auth |
|------|----------|----------|------|
| Founder | LED-8X2P-9LQ3 | FounderQuantumKey2026! | 6-Factor |
| Admin | LED-ADMIN-001 | 8thledger2026 | 3-Factor |
| Sub-Admin | LED-SUBADMIN-001 | 8thledger2026 | 3-Factor |
| User | LED-USER-001 | 8thledger2026 | Standard |

### B. Demo Halls

| Hall | Class | Vertical | Location | PAC Floor |
|------|-------|----------|----------|-----------|
| Sovereign Heights | I | LedgerProp | Dubai Marina | $2,930 per 1% |
| MetroMart | III | LedgerBiz | Nairobi | $1,025 per 1% |
| Manchester Lions FC | III | LedgerSport | Manchester | $1,850 per 1% |

### C. Contact

**Entity:** 8th Ledger Holdings Ltd.  
**Jurisdiction:** Cayman Islands  
**Founder:** The Architect (LED-8X2P-9LQ3)  
**Email:** architect@8thledger.io  
**Platform:** https://8thledger.io

---

*"The 8th Ledger is not a product. It is a movement. It is the next evolution of finance. And it belongs to everyone."*

— The Architect

---

**END OF DOCUMENT**

**Document Control:**
- Version: 4.0
- Last Updated: July 2026
- Next Review: August 2026
- Classification: Confidential — Founder Eyes Only
