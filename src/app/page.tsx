"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import GDPChart from "@/components/GDPChart";
import RankingTable from "@/components/RankingTable";
import IndicatorSelector from "@/components/IndicatorSelector";

// ─── Config (indicator codes are stable; labels are fallbacks) ──────
const INDICATORS = [
  { id: "NGDPD", label: "GDP (Current $)", unit: "Billions of U.S. dollars" },
  { id: "NGDP_RPCH", label: "Real GDP Growth", unit: "Annual percent change" },
  { id: "NGDPDPC", label: "GDP per Capita", unit: "U.S. dollars per capita" },
  { id: "PCPIPCH", label: "Inflation Rate", unit: "Annual percent change" },
  { id: "LUR", label: "Unemployment", unit: "Percent" },
  { id: "GGXWDG_NGDP", label: "Gov. Debt (% GDP)", unit: "Percent of GDP" },
];

const HIGHLIGHT_COUNTRIES = [
  "USA", "CHN", "JPN", "DEU", "IND", "GBR", "FRA", "CAN", "BRA", "ITA",
];

const IMF_API = "/api/imf";

// ─── Types ───────────────────────────────────────────────────────────
interface CountryTimeSeries {
  [countryCode: string]: { [year: string]: number };
}

interface RankingEntry {
  rank: number;
  country: string;
  countryCode: string;
  value: number;
}

interface IndicatorMeta {
  label: string;
  unit: string;
  source: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Scan every country's data to discover ALL years present in the API
 * response. This means the dashboard automatically expands when the
 * IMF adds new projection years (e.g. 2030) or when revised data
 * appears for existing years.
 */
function discoverYears(data: CountryTimeSeries): string[] {
  const yearSet = new Set<string>();
  for (const years of Object.values(data)) {
    for (const y of Object.keys(years)) {
      yearSet.add(y);
    }
  }
  return Array.from(yearSet).sort();
}

/**
 * Pick a sensible default focus year: the current calendar year if
 * data exists for it, otherwise the latest year with data.
 */
function pickDefaultYear(availableYears: string[]): string {
  const currentYear = String(new Date().getFullYear());
  if (availableYears.includes(currentYear)) return currentYear;
  return availableYears[availableYears.length - 1] ?? currentYear;
}

/**
 * For the chart, show a recent window (last ~12 years) rather than
 * the full 40+ year history, so the chart is readable. The user can
 * still see all years in the year-selector and ranking table.
 */
function recentWindow(years: string[], windowSize = 12): string[] {
  if (years.length <= windowSize) return years;
  return years.slice(years.length - windowSize);
}

// ─── Page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [indicator, setIndicator] = useState("NGDPD");
  const [focusYear, setFocusYear] = useState<string>("");
  const [countryLabels, setCountryLabels] = useState<Record<string, string>>({});
  const [seriesData, setSeriesData] = useState<CountryTimeSeries>({});
  const [indicatorMeta, setIndicatorMeta] = useState<IndicatorMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // ─── Discover years from data ────────────────────────────────────
  const availableYears = useMemo(() => discoverYears(seriesData), [seriesData]);
  const chartYears = useMemo(() => recentWindow(availableYears), [availableYears]);
  const latestYear = availableYears[availableYears.length - 1] ?? "";
  const earliestYear = availableYears[0] ?? "";

  // Auto-set focus year when data loads (or when it changes)
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(focusYear)) {
      setFocusYear(pickDefaultYear(availableYears));
    }
  }, [availableYears, focusYear]);

  // ─── Fetch country labels once ───────────────────────────────────
  useEffect(() => {
    fetch(`${IMF_API}/countries`)
      .then((r) => r.json())
      .then((data) => {
        const labels: Record<string, string> = {};
        for (const [code, meta] of Object.entries(data.countries ?? {})) {
          labels[code] = (meta as any).label ?? code;
        }
        setCountryLabels(labels);
      })
      .catch(() => {});
  }, []);

  // ─── Fetch indicator metadata (for source/edition info) ──────────
  useEffect(() => {
    fetch(`${IMF_API}/indicators`)
      .then((r) => r.json())
      .then((data) => {
        const meta = data.indicators?.[indicator];
        if (meta) {
          setIndicatorMeta({
            label: meta.label,
            unit: meta.unit,
            source: meta.source ?? "World Economic Outlook",
          });
        }
      })
      .catch(() => {});
  }, [indicator]);

  // ─── Fetch indicator data ────────────────────────────────────────
  // KEY DESIGN DECISION: No ?periods= filter. We fetch ALL available
  // years so the dashboard automatically picks up new data, revised
  // projections, and expanded year ranges when the IMF publishes a
  // new WEO edition. The year buttons and chart window are derived
  // from whatever the API returns.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${IMF_API}/${indicator}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const values: CountryTimeSeries = json.values?.[indicator] ?? {};
      setSeriesData(values);
      setLastUpdated(new Date().toLocaleString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [indicator]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data ────────────────────────────────────────────────

  // Chart data: pivot highlighted countries over the recent year window
  const chartData = chartYears.map((year) => {
    const row: Record<string, string | number> = { year };
    for (const code of HIGHLIGHT_COUNTRIES) {
      const label = countryLabels[code] ?? code;
      row[label] = seriesData[code]?.[year] ?? 0;
    }
    return row;
  });

  const chartCountryLabels = HIGHLIGHT_COUNTRIES.map(
    (c) => countryLabels[c] ?? c
  );

  // Ranking: all countries for the focus year
  const ranking: RankingEntry[] = Object.entries(seriesData)
    .filter(([, years]) => years[focusYear] != null)
    .map(([code, years]) => ({
      rank: 0,
      country: countryLabels[code] ?? code,
      countryCode: code,
      value: years[focusYear],
    }))
    .sort((a, b) => b.value - a.value)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  // Summary stats
  const currentIndicator = INDICATORS.find((i) => i.id === indicator)!;
  const displayUnit = indicatorMeta?.unit ?? currentIndicator.unit;
  const displayLabel = indicatorMeta?.label?.trim() ?? currentIndicator.label;
  const weoEdition = indicatorMeta?.source ?? "World Economic Outlook";

  const worldTotal =
    indicator === "NGDPD"
      ? ranking.reduce((sum, r) => sum + r.value, 0)
      : null;
  const topCountry = ranking[0];

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-imf-accent/5 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-mono text-imf-accent tracking-widest uppercase mb-2">
                IMF World Economic Outlook
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
                Global Economic{" "}
                <span className="text-gradient">Dashboard</span>
              </h1>
              <p className="mt-2 text-imf-muted text-sm max-w-xl font-body">
                Live data from the{" "}
                <a
                  href="https://www.imf.org/external/datamapper/api/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-imf-accent hover:underline"
                >
                  IMF DataMapper API
                </a>
                .{" "}
                {availableYears.length > 0 && (
                  <>
                    Covers {earliestYear}–{latestYear} including IMF
                    staff projections.
                  </>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-imf-muted font-mono">
                Edition: {weoEdition}
              </p>
              {lastUpdated && (
                <p className="text-xs text-imf-muted/60 font-mono mt-0.5">
                  Fetched: {lastUpdated}
                </p>
              )}
              <a
                href="https://www.imf.org/external/datamapper/NGDPD@WEO/OEMDC/ADVEC/WEOWORLD"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-imf-accent hover:text-white transition-colors"
              >
                View on IMF.org →
              </a>
            </div>
          </div>
        </header>

        {/* Indicator Selector */}
        <section className="mb-8">
          <IndicatorSelector
            indicators={INDICATORS}
            selected={indicator}
            onChange={setIndicator}
          />
        </section>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-imf-rose/10 border border-imf-rose/30 text-imf-rose text-sm">
            <strong>Error:</strong> {error}{" "}
            <button
              onClick={fetchData}
              className="underline hover:text-white ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-imf-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-imf-muted text-sm font-mono">
                Fetching from IMF API…
              </p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stat Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Indicator"
                value={displayLabel}
                sub={displayUnit}
                color="blue"
              />
              <StatCard
                label={`#1 Economy (${focusYear})`}
                value={topCountry?.country ?? "—"}
                sub={
                  topCountry
                    ? indicator === "NGDPD"
                      ? `$${(topCountry.value / 1000).toFixed(2)}T`
                      : `${topCountry.value.toFixed(2)}`
                    : ""
                }
                color="emerald"
              />
              {worldTotal != null && (
                <StatCard
                  label={`World Total (${focusYear})`}
                  value={`$${(worldTotal / 1000).toFixed(1)}T`}
                  sub="Sum of all countries"
                  color="gold"
                />
              )}
              <StatCard
                label="Countries"
                value={String(Object.keys(seriesData).length)}
                sub={`With data for ${focusYear}`}
                color="rose"
              />
            </section>

            {/* Year selector — built from discovered years */}
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-xs text-imf-muted font-mono">
                  Focus Year
                </label>
                <span className="text-[10px] text-imf-muted/50 font-mono">
                  {availableYears.length} years available
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableYears.map((y) => {
                  const isFuture = Number(y) > new Date().getFullYear();
                  return (
                    <button
                      key={y}
                      onClick={() => setFocusYear(y)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                        focusYear === y
                          ? "bg-imf-accent text-white"
                          : isFuture
                          ? "bg-imf-slate/20 text-imf-muted/60 hover:text-white hover:bg-imf-slate italic"
                          : "bg-imf-slate/40 text-imf-muted hover:text-white hover:bg-imf-slate"
                      }`}
                    >
                      {y}
                      {isFuture && <span className="ml-0.5 text-[8px] not-italic align-super">est</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Chart — uses recent window */}
            <section className="bg-imf-deep/80 backdrop-blur-sm rounded-2xl p-6 card-glow mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-display text-xl text-white">
                  {displayLabel} — Top 10 Economies
                </h2>
                <span className="text-[10px] text-imf-muted font-mono">
                  {chartYears[0]}–{chartYears[chartYears.length - 1]}
                </span>
              </div>
              <GDPChart
                data={chartData}
                countries={chartCountryLabels}
                unit={displayUnit}
              />
            </section>

            {/* Ranking Table */}
            <section className="bg-imf-deep/80 backdrop-blur-sm rounded-2xl p-6 card-glow">
              <RankingTable
                data={ranking}
                year={focusYear}
                unit={displayUnit}
              />
            </section>

            {/* Footer — edition pulled from API, not hardcoded */}
            <footer className="mt-12 pt-6 border-t border-imf-slate/30 text-center">
              <p className="text-xs text-imf-muted font-mono">
                Data source:{" "}
                <a
                  href="https://www.imf.org/external/datamapper/api/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-imf-accent hover:underline"
                >
                  IMF DataMapper API v1
                </a>{" "}
                — {weoEdition}
              </p>
              <p className="text-[10px] text-imf-muted/60 mt-1">
                Data refreshes on each page load. Projections are IMF staff estimates
                and update with each WEO edition (April &amp; October).
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "emerald" | "gold" | "rose";
}) {
  const accents = {
    blue: "border-imf-accent/30 text-imf-accent",
    emerald: "border-imf-emerald/30 text-imf-emerald",
    gold: "border-imf-gold/30 text-imf-gold",
    rose: "border-imf-rose/30 text-imf-rose",
  };

  return (
    <div
      className={`bg-imf-deep/80 backdrop-blur-sm rounded-xl p-4 border ${accents[color].split(" ")[0]} card-glow`}
    >
      <p className="text-[10px] font-mono text-imf-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-lg font-display ${accents[color].split(" ")[1]}`}>
        {value}
      </p>
      <p className="text-xs text-imf-muted mt-0.5">{sub}</p>
    </div>
  );
}
