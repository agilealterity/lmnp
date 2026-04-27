import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const pct = (n: number) => Number(n).toFixed(1).replace(".", ",") + "%";
const POS = "#1D9E75", NEG = "#D85A30";

function SliderField({ label, min, max, step, value, onChange, display }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; display: string }) {
  return (
    <div style={{ marginBottom: "0.9rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

function NumberField({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div style={{ marginBottom: "0.9rem" }}>
      <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ flex: 1, fontSize: 14, padding: "5px 10px", height: 34 }} />
        <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{unit}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, colored, isPos }: { label: string; value: string; colored?: boolean; isPos?: boolean }) {
  const color = colored ? (isPos ? POS : NEG) : "var(--color-text-primary)";
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ fontWeight: 500, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name} : {fmt(p.value)} €
        </div>
      ))}
    </div>
  );
};

interface Params {
  prix: number; notaire: number; apport: number;
  mensualite: number; duree: number;
  loyer: number; reval: number; vacance: number;
  charges: number; taxe: number; assurance: number; gestion: number;
}

interface Row {
  y: number; name: string; loyerBrut: number; vacance: number;
  loyerNet: number; chargesTotal: number; credit: number; cashflow: number; cumul: number;
}

function compute(p: Params) {
  const prixTotal = p.prix * (1 + p.notaire / 100);
  const loyerBrutBase = p.loyer * 12;
  const creditAn = p.mensualite * 12;
  let cumul = -p.apport;
  const rows: Row[] = [];
  for (let y = 1; y <= 20; y++) {
    const loyerBrut = loyerBrutBase * Math.pow(1 + p.reval / 100, y - 1);
    const vacance = loyerBrut * p.vacance / 100;
    const loyerNet = loyerBrut - vacance;
    const gestion = loyerNet * p.gestion / 100;
    const chargesTotal = p.charges + p.taxe + p.assurance + gestion;
    const credit = y <= p.duree ? creditAn : 0;
    const cashflow = loyerNet - chargesTotal - credit;
    cumul += cashflow;
    rows.push({ y, name: "An " + y, loyerBrut, vacance, loyerNet, chargesTotal, credit, cashflow, cumul });
  }
  const rendBrut = (loyerBrutBase / prixTotal) * 100;
  const loyerNetBase = loyerBrutBase * (1 - p.vacance / 100);
  const chargesBase = p.charges + p.taxe + p.assurance + loyerNetBase * p.gestion / 100;
  const rendNet = ((loyerNetBase - chargesBase) / prixTotal) * 100;
  return { rows, rendBrut, rendNet, prixTotal };
}

export default function App() {
  const [p, setP] = useState<Params>({
    prix: 200000, notaire: 8, apport: 40000,
    mensualite: 800, duree: 20,
    loyer: 900, reval: 1.5, vacance: 5,
    charges: 1200, taxe: 800, assurance: 200, gestion: 0
  });
  const set = (k: keyof Params, v: number) => setP(prev => ({ ...prev, [k]: v }));
  const { rows, rendBrut, rendNet, prixTotal } = compute(p);
  const cf1 = rows[0].cashflow;
  const cumul20 = rows[19].cumul;

  const card: React.CSSProperties = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1.25rem" };
  const sep: React.CSSProperties = { border: "none", borderTop: "0.5px solid var(--color-border-tertiary)", margin: "1rem 0" };
  const secTitle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.9rem", paddingBottom: 8, borderBottom: "0.5px solid var(--color-border-tertiary)" };

  return (
    <div style={{ padding: "1.5rem 0", fontFamily: "var(--font-sans)" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Simulateur LMNP — projection 20 ans</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 4 }}>Renseignez vos paramètres pour obtenir une projection complète.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem", alignItems: "start" }}>

        {/* Panneau gauche */}
        <div style={card}>
          <div style={secTitle}>Acquisition</div>
          <NumberField label="Prix d'achat" value={p.prix} onChange={v => set("prix", v)} unit="€" />
          <SliderField label="Frais de notaire" min={2} max={12} step={0.5} value={p.notaire} onChange={v => set("notaire", v)} display={pct(p.notaire)} />
          <NumberField label="Apport personnel" value={p.apport} onChange={v => set("apport", v)} unit="€" />
          <hr style={sep} />
          <div style={secTitle}>Financement (crédit)</div>
          <NumberField label="Mensualité crédit" value={p.mensualite} onChange={v => set("mensualite", v)} unit="€/mois" />
          <SliderField label="Durée du crédit" min={5} max={25} step={1} value={p.duree} onChange={v => set("duree", v)} display={p.duree + " ans"} />
          <hr style={sep} />
          <div style={secTitle}>Revenus locatifs</div>
          <NumberField label="Loyer mensuel" value={p.loyer} onChange={v => set("loyer", v)} unit="€/mois" />
          <SliderField label="Revalorisation annuelle" min={0} max={5} step={0.1} value={p.reval} onChange={v => set("reval", v)} display={pct(p.reval)} />
          <SliderField label="Taux de vacance" min={0} max={20} step={0.5} value={p.vacance} onChange={v => set("vacance", v)} display={pct(p.vacance)} />
          <hr style={sep} />
          <div style={secTitle}>Charges annuelles</div>
          <NumberField label="Charges de copropriété" value={p.charges} onChange={v => set("charges", v)} unit="€/an" />
          <NumberField label="Taxe foncière" value={p.taxe} onChange={v => set("taxe", v)} unit="€/an" />
          <NumberField label="Assurance PNO" value={p.assurance} onChange={v => set("assurance", v)} unit="€/an" />
          <SliderField label="Frais de gestion" min={0} max={15} step={0.5} value={p.gestion} onChange={v => set("gestion", v)} display={pct(p.gestion)} />
        </div>

        {/* Panneau droit */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
            <Metric label="Rendement brut" value={pct(rendBrut)} />
            <Metric label="Rendement net" value={pct(rendNet)} />
            <Metric label="Cashflow an 1" value={(cf1 >= 0 ? "+" : "") + fmt(cf1) + " €"} colored isPos={cf1 >= 0} />
            <Metric label="Cashflow cumulé 20 ans" value={(cumul20 >= 0 ? "+" : "") + fmt(cumul20) + " €"} colored isPos={cumul20 >= 0} />
            <Metric label="Coût total acquisition" value={fmt(prixTotal) + " €"} />
            <Metric label="Loyer brut an 1" value={fmt(rows[0].loyerBrut) + " €"} />
          </div>

          <div style={{ ...card, marginBottom: "1.5rem" }}>
            <div style={secTitle}>Cashflow annuel &amp; cumulé</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(29,158,117,0.55)" }}></span>Cashflow / an</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 2, background: POS, display: "inline-block" }}></span>Cumulé</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={rows} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v) + " €"} width={72} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: POS }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v) + " €"} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="left" y={0} stroke="rgba(128,128,128,0.3)" />
                <Bar yAxisId="left" dataKey="cashflow" name="Cashflow" fill="rgba(29,158,117,0.55)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumul" name="Cumulé" stroke={POS} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={secTitle}>Tableau de projection annuelle</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Année", "Loyer brut", "Vacance", "Loyer net", "Charges", "Mensualités", "Cashflow", "Cumulé"].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "7px 10px", fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.y} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                      <td style={{ padding: "6px 10px", fontWeight: 500 }}>{r.y}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right" }}>{fmt(r.loyerBrut)} €</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: NEG }}>-{fmt(r.vacance)} €</td>
                      <td style={{ padding: "6px 10px", textAlign: "right" }}>{fmt(r.loyerNet)} €</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: NEG }}>-{fmt(r.chargesTotal)} €</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: NEG }}>{r.credit > 0 ? "-" + fmt(r.credit) + " €" : "—"}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: r.cashflow >= 0 ? POS : NEG }}>{r.cashflow >= 0 ? "+" : ""}{fmt(r.cashflow)} €</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: r.cumul >= 0 ? POS : NEG }}>{r.cumul >= 0 ? "+" : ""}{fmt(r.cumul)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
