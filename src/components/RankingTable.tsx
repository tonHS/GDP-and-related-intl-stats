interface RankingEntry {
  rank: number;
  country: string;
  countryCode: string;
  value: number;
}

interface Props {
  data: RankingEntry[];
  year: string;
  unit: string;
}

export default function RankingTable({ data, year, unit }: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl text-white">
          Country Rankings — {year}
        </h2>
        <span className="text-xs text-imf-muted font-mono">{unit}</span>
      </div>

      <div className="overflow-auto max-h-[520px] scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-imf-deep">
            <tr className="border-b border-imf-slate/50">
              <th className="text-left py-2 px-3 text-imf-muted font-mono text-xs w-12">
                #
              </th>
              <th className="text-left py-2 px-3 text-imf-muted font-mono text-xs">
                Country
              </th>
              <th className="text-left py-2 px-3 text-imf-muted font-mono text-xs hidden sm:table-cell">
                Code
              </th>
              <th className="text-right py-2 px-3 text-imf-muted font-mono text-xs">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.countryCode}
                className="border-b border-imf-slate/20 hover:bg-imf-slate/20 transition-colors"
              >
                <td className="py-2 px-3 text-imf-muted font-mono text-xs">
                  {row.rank}
                </td>
                <td className="py-2 px-3 text-white">{row.country}</td>
                <td className="py-2 px-3 text-imf-muted font-mono text-xs hidden sm:table-cell">
                  {row.countryCode}
                </td>
                <td className="py-2 px-3 text-right text-imf-accent font-mono tabular-nums">
                  {row.value.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
