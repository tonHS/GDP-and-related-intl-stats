interface Indicator {
  id: string;
  label: string;
  unit: string;
}

interface Props {
  indicators: Indicator[];
  selected: string;
  onChange: (id: string) => void;
}

export default function IndicatorSelector({
  indicators,
  selected,
  onChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {indicators.map((ind) => (
        <button
          key={ind.id}
          onClick={() => onChange(ind.id)}
          title={ind.unit}
          className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
            selected === ind.id
              ? "bg-imf-accent text-white shadow-lg shadow-imf-accent/20"
              : "bg-imf-deep/80 text-imf-muted hover:text-white hover:bg-imf-slate border border-imf-slate/50"
          }`}
        >
          {ind.label}
        </button>
      ))}
    </div>
  );
}
