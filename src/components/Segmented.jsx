// Material 3 세그먼트 버튼 그룹. options: [{ value, label, title? }]
export default function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-md-s border border-outline p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.title}
            className={`rounded-md-xs px-3 py-1 text-label-l transition ${
              active
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-c-high"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
