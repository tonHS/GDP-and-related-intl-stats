/**
 * IMF DataMapper API v1 Client
 *
 * Base URL: https://www.imf.org/external/datamapper/api/v1
 *
 * Endpoints:
 *   /indicators          — list all available indicator codes + metadata
 *   /countries           — list all country codes + labels
 *   /regions             — list geographical regions
 *   /groups              — list analytical groups (e.g. OEMDC, ADVEC)
 *   /<indicator>         — all data for one indicator
 *   /<indicator>/<iso>   — data for one indicator + one country
 *   ?periods=2024,2025   — restrict to specific years
 *
 * Response shape for time-series:
 * {
 *   "values": {
 *     "NGDPD": {
 *       "USA": { "2024": 29168.291, "2025": 30338.097, ... },
 *       "CAN": { "2024": 2242.182, ... },
 *       ...
 *     }
 *   }
 * }
 */

const IMF_API_BASE = "https://www.imf.org/external/datamapper/api/v1";

// ─── Types ──────────────────────────────────────────────────────────
export interface IndicatorMeta {
  label: string;
  description: string;
  source: string;
  unit: string;
  dataset: string;
}

export interface CountryMeta {
  label: string;
}

export interface TimeSeriesValues {
  [countryCode: string]: { [year: string]: number };
}

export interface IMFTimeSeriesResponse {
  values: { [indicatorId: string]: TimeSeriesValues };
}

export interface CountryYearRow {
  country: string;
  countryCode: string;
  year: string;
  value: number;
}

// ─── Fetchers ───────────────────────────────────────────────────────

/**
 * Generic fetcher with caching headers for ISR / Vercel edge caching.
 * The `revalidate` param controls Next.js ISR: data is cached and
 * revalidated in the background every N seconds.
 */
async function imfFetch<T>(path: string, revalidate = 3600): Promise<T> {
  const url = `${IMF_API_BASE}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`IMF API error: ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json();
}

/** Fetch indicator metadata (label, unit, source, etc.) */
export async function getIndicatorMeta(
  indicatorId: string
): Promise<IndicatorMeta | null> {
  const data = await imfFetch<{ indicators: Record<string, IndicatorMeta> }>(
    "/indicators"
  );
  return data.indicators[indicatorId] ?? null;
}

/** Fetch the full country code → label mapping */
export async function getCountries(): Promise<Record<string, CountryMeta>> {
  const data = await imfFetch<{ countries: Record<string, CountryMeta> }>(
    "/countries"
  );
  return data.countries;
}

/** Fetch the full groups mapping (OEMDC, ADVEC, WEOWORLD, etc.) */
export async function getGroups(): Promise<
  Record<string, { label: string }>
> {
  const data = await imfFetch<{ groups: Record<string, { label: string }> }>(
    "/groups"
  );
  return data.groups;
}

/**
 * Fetch time-series data for an indicator.
 *
 * @param indicatorId  e.g. "NGDPD" for GDP current prices
 * @param countries    optional array of ISO country codes, e.g. ["USA","CAN"]
 * @param periods      optional array of years, e.g. ["2024","2025","2026"]
 */
export async function getIndicatorData(
  indicatorId: string,
  countries: string[] = [],
  periods: string[] = []
): Promise<TimeSeriesValues> {
  let path = `/${indicatorId}`;
  if (countries.length) {
    path += `/${countries.join("/")}`;
  }
  if (periods.length) {
    path += `?periods=${periods.join(",")}`;
  }
  const data = await imfFetch<IMFTimeSeriesResponse>(path);
  return data.values?.[indicatorId] ?? {};
}

/**
 * Convenience: flatten the nested IMF response into a flat array
 * suitable for Recharts / table rendering.
 */
export function flattenToRows(
  values: TimeSeriesValues,
  countryLabels: Record<string, string>
): CountryYearRow[] {
  const rows: CountryYearRow[] = [];
  for (const [code, years] of Object.entries(values)) {
    for (const [year, value] of Object.entries(years)) {
      if (value != null) {
        rows.push({
          country: countryLabels[code] ?? code,
          countryCode: code,
          year,
          value,
        });
      }
    }
  }
  return rows.sort((a, b) => a.year.localeCompare(b.year));
}

/**
 * Build a Recharts-friendly array: one object per year, with each
 * country as a key.  e.g. [{ year: "2024", USA: 29168, CAN: 2242, ... }]
 */
export function pivotByYear(
  values: TimeSeriesValues,
  countryLabels: Record<string, string>
): Record<string, string | number>[] {
  const yearMap: Record<string, Record<string, string | number>> = {};

  for (const [code, years] of Object.entries(values)) {
    const label = countryLabels[code] ?? code;
    for (const [year, value] of Object.entries(years)) {
      if (value == null) continue;
      if (!yearMap[year]) yearMap[year] = { year };
      yearMap[year][label] = Math.round(value * 100) / 100;
    }
  }

  return Object.values(yearMap).sort((a, b) =>
    String(a.year).localeCompare(String(b.year))
  );
}
