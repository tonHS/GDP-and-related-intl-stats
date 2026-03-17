# IMF World Economic Outlook — GDP Dashboard

A dynamic dashboard that pulls live data from the **IMF DataMapper API** and displays GDP, growth, inflation, unemployment, and debt metrics for every country in the world.

**Live data** · **No API key needed** · **Deploys on Vercel in 1 click**

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Recharts](https://img.shields.io/badge/Recharts-2.12-orange)

---

## How the IMF DataMapper API Works

The IMF provides a free, public JSON API at:

```
https://www.imf.org/external/datamapper/api/v1
```

**No authentication or API key is required.** The API documentation is at:
https://www.imf.org/external/datamapper/api/help

### Key Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `/indicators` | List all available indicator codes | [/indicators](https://www.imf.org/external/datamapper/api/v1/indicators) |
| `/countries` | List all country ISO codes + labels | [/countries](https://www.imf.org/external/datamapper/api/v1/countries) |
| `/regions` | Geographical regions | [/regions](https://www.imf.org/external/datamapper/api/v1/regions) |
| `/groups` | Analytical groups (OEMDC, ADVEC, etc.) | [/groups](https://www.imf.org/external/datamapper/api/v1/groups) |
| `/<indicator>` | All data for one indicator | [/NGDPD](https://www.imf.org/external/datamapper/api/v1/NGDPD) |
| `/<indicator>/<country>` | Data for one country | [/NGDPD/USA](https://www.imf.org/external/datamapper/api/v1/NGDPD/USA) |
| `/<indicator>?periods=2024,2025` | Filter by year | [/NGDPD?periods=2026](https://www.imf.org/external/datamapper/api/v1/NGDPD?periods=2026) |

### Response Format

```json
{
  "values": {
    "NGDPD": {
      "USA": { "2024": 29168.291, "2025": 30338.097, "2026": 31431.585 },
      "CAN": { "2024": 2242.182, "2025": 2311.532, "2026": 2414.874 }
    }
  }
}
```

### Available Indicators (selection)

| Code | Label | Unit |
|------|-------|------|
| `NGDPD` | GDP, current prices | Billions of U.S. dollars |
| `NGDP_RPCH` | Real GDP growth | Annual percent change |
| `NGDPDPC` | GDP per capita | U.S. dollars per capita |
| `PCPIPCH` | Inflation rate (CPI) | Annual percent change |
| `LUR` | Unemployment rate | Percent |
| `GGXWDG_NGDP` | Government gross debt | Percent of GDP |
| `BCA_NGDPD` | Current account balance | Percent of GDP |
| `LP` | Population | Millions of people |

### URL Mapping

The IMF DataMapper page you linked:
```
https://www.imf.org/external/datamapper/NGDPD@WEO/OEMDC/ADVEC/WEOWORLD?year=2026
```

Maps to this API call:
```
https://www.imf.org/external/datamapper/api/v1/NGDPD?periods=2026
```

Where:
- `NGDPD` = indicator code (GDP, current prices)
- `@WEO` = dataset (World Economic Outlook) — implied in the API
- `OEMDC/ADVEC/WEOWORLD` = analytical groups shown on the map — the API returns all countries by default
- `?year=2026` becomes `?periods=2026`

---

## Project Architecture

```
imf-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (metadata, fonts)
│   │   ├── page.tsx            # Main dashboard (client component)
│   │   ├── globals.css         # Tailwind + custom styles
│   │   └── api/
│   │       └── imf/
│   │           └── route.ts    # Optional: server-side API proxy
│   ├── lib/
│   │   └── imf-api.ts          # IMF API client library (typed)
│   └── components/
│       ├── GDPChart.tsx         # Recharts bar/line chart
│       ├── RankingTable.tsx     # Country ranking with bars
│       └── IndicatorSelector.tsx # Indicator toggle buttons
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

### Data Flow

```
IMF DataMapper API (public, free, no key)
        │
        ▼
  Client fetch() in page.tsx
  (or /api/imf proxy route for CORS safety)
        │
        ▼
  React state → derived data
        │
        ├── GDPChart (Recharts)     — top 10 countries over time
        ├── RankingTable            — all countries sorted for focus year
        └── StatCards               — summary metrics
```

**Why client-side fetching?** The IMF API has generous CORS headers and no rate limits for reasonable usage. Client-side fetching means the page is fully interactive with zero server cost. The included `/api/imf` route is available as a fallback proxy if you ever hit CORS issues or want to add caching logic.

---

## Deploy to Vercel

### Option 1: One-Click Deploy

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click **Deploy** — no environment variables needed

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 3: Local Development

```bash
git clone <your-repo-url>
cd imf-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Customization

### Add more indicators

Edit the `INDICATORS` array in `src/app/page.tsx`. Find available codes at:
https://www.imf.org/external/datamapper/api/v1/indicators

### Change highlighted countries

Edit `HIGHLIGHT_COUNTRIES` in `src/app/page.tsx` using ISO 3-letter codes.
Find codes at: https://www.imf.org/external/datamapper/api/v1/countries

### Change year range

Edit `YEAR_RANGE` in `src/app/page.tsx`. The IMF WEO dataset typically
includes data from ~1980 through ~2029 (with projections).

### Use the server-side proxy

If you prefer server-side data fetching or need to cache aggressively:

```typescript
// Instead of fetching IMF directly:
const res = await fetch(`/api/imf?indicator=NGDPD&periods=2024,2025,2026`);
```

The proxy route at `/api/imf` adds `Cache-Control` headers that work with
Vercel's edge caching for fast global performance.

---

## Data Notes

- **Source**: IMF World Economic Outlook (October 2025 edition)
- **Coverage**: ~195 countries, 1980–2029
- **Updates**: The IMF updates WEO data twice per year (April and October)
- **Projections**: Years beyond the current year are IMF staff estimates
- **License**: [IMF Data Terms](https://www.imf.org/en/About/copyright-and-terms#data) — free for non-commercial and most commercial uses with attribution

---

## License

MIT — Data © International Monetary Fund
