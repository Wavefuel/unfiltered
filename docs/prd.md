# 📰 Unfiltered – MVP Product Requirements Document (One-Week Build)

---

## TL;DR

**Unfiltered** is a real-time, map-based monitoring platform for the Indo-Pakistan conflict. It aggregates events from credible sources, classifies them by type and geography, and presents them in a simple, trusted interface — map, timeline, and feed. This MVP will be public, mobile-friendly, and built in **one week** by a 7-person team.

---

## 🧠 Problem Statement

People trying to understand the Indo-Pakistan situation are overwhelmed by noise, propaganda, and unreliable reporting. There is no centralized, structured, or unbiased way to follow events as they unfold — especially for non-expert users. **Unfiltered** fixes that.

---

## 🎯 MVP Goals

### Must-Haves (Ship this Week)

-   Show real-time events on a **map** and a **feed**
-   Let users **filter by time and event type**
-   Pull events from scrapers and show them within seconds
-   Include **source attribution** and **basic trust info**

### Nice-to-Haves (If time allows)

-   Event detail modal with source links and bias score
-   Timeline scrubber with playback
-   Mobile-optimized layout
-   Basic SEO metadata

### Out of Scope for MVP

-   Multi-language support
-   Social sharing
-   User accounts or alerts
-   Advanced credibility scoring

---

## 👥 Target Users

### Concerned Citizens

-   Want quick updates, safety context
-   Mobile-first, low attention bandwidth

### Analysts/Journalists

-   Need credible, timestamped, geolocated data
-   Want to reference or cite specific events

---

## 🧩 Core Features

### 1. **Live Feed**

-   Chronological list of conflict events
-   Updates every 30s or via WebSockets
-   Includes timestamp, headline, type, location, and source

### 2. **Interactive Map (Mapbox)**

-   Geolocated event markers
-   Clustering on zoom out
-   Click → Event preview modal

### 3. **Filters**

-   Filter by:
    -   Event type (e.g., “strike”, “protest”, “alert”)
    -   Time range (last hour, 6 hours, 24 hours)

---

## 💻 Technical Plan (1-Week Build)

### Frontend (Next.js + Mapbox)

-   Client-rendered, static build with SWR for data fetching
-   Pages:
    -   `/` (Home: Map + Feed)
    -   `/event/[id]` (Optional modal or full page)
-   State: Simple React state or Zustand
-   Map: Mapbox GL JS, geo clustering, flyTo on click

### Backend (Node.js + Express)

-   Event API: `/api/events`
    -   Fetches from Elasticsearch
    -   Supports query params: `type`, `since`, `lat/lng bounds`

### Scraping Pipeline (Node.js + Puppeteer)

-   Scheduled tasks or cron job
-   Pulls from:
    -   Top 3 news sites (e.g., Dawn, Times of India)
    -   1–2 Twitter accounts via API or Nitter
-   Tags each event:
    -   Title, summary, timestamp, location, type, source URL

### Data Processing (Simple Heuristics)

-   Event type classified via keyword match
-   Geolocation via place name → lat/lng (Mapbox API)
-   Confidence: “Verified” if from multiple known sources

### Elasticsearch

-   Single `events` index
-   Fields:
    -   `title`, `description`, `timestamp`, `type`, `geo`, `source`, `credibility`, `bias`

---

## 🔥 Team Roles for 1-Week Sprint

| Role                       | Owner     | Focus                                 |
| -------------------------- | --------- | ------------------------------------- |
| Tech Lead                  | You (?)   | Coordinate, unblock, review PRs       |
| Scrapers (2 devs)          | Dev A & B | Build and stabilize core ingestion    |
| Backend/API (1 dev)        | Dev C     | Set up Express + Elastic integration  |
| Frontend (2 devs)          | Dev D & E | Build Feed, Map, Filters, Event Modal |
| Design/UX (1 designer/dev) | Dev F     | Wireframes, UI polish, map styling    |

---

## 🖥️ UX Guidelines

-   **Map-first experience** with secondary feed
-   Clean, dark-themed layout for readability
-   Hover/click → details, not too much info at once
-   Prioritize **clarity over density**
-   Event cards must show:
    -   Time
    -   Location (city, region)
    -   Source logo/text
    -   Type (icon + label)

---

## 📈 Success Metrics

-   MVP Launch in 7 Days
-   Working map + feed integration
-   > 500 unique visitors on launch day
-   < 1s API response time
-   Scraper stability: < 5% error rate

---

## 🗓 Milestones

### Day 1

-   Define schemas
-   Setup Elastic & Next.js scaffolding
-   Build feed UI + dummy data

### Day 2–3

-   Scraper: get 3 sources live
-   Mapbox base map + markers
-   API: `/api/events`

### Day 4

-   Integrate map + feed
-   Add filters (event type, time)
-   Clean frontend design + layout

### Day 5–6

-   Polish UX, fix bugs
-   Add modals/tooltips
-   SEO basics (titles, metadata)
-   Uptime and logging

### Day 7

-   Test full flow
-   Internal launch + feedback
-   Public release: post on Reddit, Twitter, Telegram, WhatsApp, LinkedIn

---

## 📌 Summary

Unfiltered is a focused, high-urgency product built to give real-time clarity to people following the Indo-Pakistan conflict. The MVP will focus on **doing a few things extremely well**: ingest live data, classify it quickly, and show it clearly.

We’re not trying to be a full OSINT platform this week. We’re trying to become the **most trusted, usable source for people trying to understand what’s happening — right now.**

Let’s go build it.
