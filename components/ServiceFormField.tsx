// ServiceFormField — defined at module level so React never unmounts it between
// renders. Never define React components inside other components.

const NAVY  = "#0A2F61";
const LGRAY = "#9CA3AF";
const MT    = "'Montserrat', system-ui, sans-serif";
const BASE  = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";

export default function ServiceFormField({
  label, required, hint, placeholder, rows, value, error, onChange,
}: {
  label:       string;
  required?:   boolean;
  hint?:       string;
  placeholder: string;
  rows?:       number;
  value:       string;
  error?:      string;
  onChange:    (v: string) => void;
}) {
  const cls = `${BASE} ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`;
  return (
    <div>
      <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: hint ? "3px" : "6px" }}>
        {label}
        {required  && <span style={{ color: "#EF4444" }}> *</span>}
        {!required && <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}> (optional)</span>}
      </label>
      {hint && <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>{hint}</p>}
      {rows
        ? <textarea
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`${cls} resize-y`}
            style={{ fontFamily: MT }}
            data-error={error ? true : undefined}
          />
        : <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={cls}
            style={{ fontFamily: MT }}
            data-error={error ? true : undefined}
          />
      }
      {error && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}
