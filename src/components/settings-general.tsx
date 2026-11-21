"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, Tag, Field, td } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, DollarSign, SlidersHorizontal, Calculator, Loader2, Minus, Plus, ChevronDown } from "lucide-react";

interface Draft {
  revenueBand: string;
  lossEvents: number;
  typicalPct: number | null; // null = use the default
  investment: number;
}

interface Preview {
  year: number;
  usingSampleData: boolean;
  band: {
    label: string;
    assumed: boolean;
    eventProbability: number;
    eventProbabilityLow: number;
    eventProbabilityHigh: number;
    typicalLoss: number;
    severeLoss: number;
  };
  result: {
    typicalControlEffectiveness: number;
    exposure: number;
    controlEffectiveness: number;
    lossAvoided: number;
    lossAvoidedLow: number;
    lossAvoidedHigh: number;
    residualLoss: number;
    lossProbabilityWithoutControls: number;
    lossProbabilityWithControls: number;
    investment: number;
    netBenefit: number;
    roi: number;
    incidentsCounted: number;
  };
}

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";
const MIN_TYPICAL = 20;
const MAX_TYPICAL = 80;

const toBody = (d: Draft) => ({
  investmentAmount: d.investment,
  organisation: {
    revenueBand: d.revenueBand || null,
    lossEventsLast12Months: d.lossEvents,
    typicalControlEffectiveness: d.typicalPct === null ? null : d.typicalPct / 100,
  },
});

export default function GeneralSettings({ canEdit }: { canEdit: boolean }) {
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [bands, setBands] = useState<{ id: string; label: string }[]>([]);
  const [defaultTypical, setDefaultTypical] = useState(40);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAssumption, setShowAssumption] = useState(false);
  const requestId = useRef(0);

  // Load the saved settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        const typical = s.organisation?.typicalControlEffectiveness;
        const loaded: Draft = {
          revenueBand: s.organisation?.revenueBand || "",
          lossEvents: s.organisation?.lossEventsLast12Months || 0,
          typicalPct: typical ? Math.round(typical * 100) : null,
          investment: s.investmentAmount || 0,
        };
        setBands(s.revenueBands || []);
        setDefaultTypical(Math.round((s.defaultTypicalControlEffectiveness ?? 0.4) * 100));
        setSaved(loaded);
        setDraft(loaded);
        setShowAssumption(loaded.typicalPct !== null);
      })
      .catch(() => setMessage({ ok: false, text: "Could not load settings" }));
  }, []);

  // Recalculate the preview shortly after each change. Nothing is saved.
  useEffect(() => {
    if (!draft) return;
    const id = ++requestId.current;
    setPreviewing(true);
    const timer = setTimeout(() => {
      fetch("/api/settings/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBody(draft)),
      })
        .then((r) => r.json())
        .then((p) => {
          if (id === requestId.current && p.success) setPreview(p);
        })
        .catch(() => {})
        .finally(() => {
          if (id === requestId.current) setPreviewing(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [draft]);

  const dirty = useMemo(() => !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  if (!draft || !saved) {
    return (
      <div className="flex justify-center py-16">
        {message ? <p className="text-[13px] text-red-600">{message.text}</p> : <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />}
      </div>
    );
  }

  const set = (patch: Partial<Draft>) => {
    // Functional update, so two changes landing in the same tick both apply
    setDraft((d) => ({ ...d, ...patch }));
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBody(draft)),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not save");
      setSaved(draft);
      setMessage({ ok: true, text: "Saved. The dashboard now uses these figures." });
    } catch (err: any) {
      setMessage({ ok: false, text: "Failed to save: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const typical = draft.typicalPct ?? defaultTypical;
  const r = preview?.result;
  const b = preview?.band;

  // Each figure, and which setting on this page drives it.
  const rows: { label: string; value: string; note?: string; setBy: string; strong?: boolean; negative?: boolean }[] = r
    ? [
        {
          label: "Chance of a material loss this year",
          value: `${r.lossProbabilityWithControls}%`,
          note: `${r.lossProbabilityWithoutControls}% without detection and response`,
          setBy: "Revenue, loss events",
          strong: true,
        },
        { label: "Exposure without detection and response", value: money(r.exposure), setBy: "Revenue, assumption" },
        {
          label: "Your control effectiveness",
          value: `${r.controlEffectiveness}%`,
          note: `From ${r.incidentsCounted.toLocaleString()} contained incident${r.incidentsCounted === 1 ? "" : "s"} this year`,
          setBy: "Loss events",
        },
        {
          label: "Expected loss avoided",
          value: money(r.lossAvoided),
          note: `Range ${money(r.lossAvoidedLow)} to ${money(r.lossAvoidedHigh)}`,
          setBy: "All of the above",
          strong: true,
        },
        { label: "Expected loss still carried", value: money(r.residualLoss), setBy: "All of the above" },
        { label: "Security investment", value: money(r.investment), setBy: "Investment" },
        { label: "Net benefit", value: money(r.netBenefit), setBy: "Investment", negative: r.netBenefit < 0 },
        { label: "ROI", value: `${r.roi.toLocaleString("en-US")}%`, setBy: "Investment", negative: r.roi < 0 },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
      {/* ── The settings ─────────────────────────────────────────────── */}
      <div className="space-y-3 min-w-0">
        <Panel icon={Building2} title="Your organisation" subtitle="Sets how much there is to lose">
          <div className="p-3 space-y-3">
            <Field label="Annual revenue">
              <select
                value={draft.revenueBand}
                onChange={(e) => set({ revenueBand: e.target.value })}
                disabled={!canEdit}
                aria-label="Annual revenue"
                className="h-8 w-full max-w-xs rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900"
              >
                <option value="">Not set (assuming $100M – $1B)</option>
                {bands.map((band) => (
                  <option key={band.id} value={band.id}>{band.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-[12px] text-neutral-500">
                {b ? (
                  <>
                    Published for {b.label}: a {b.eventProbability}% chance of a loss event in a year (studies put it between{" "}
                    {b.eventProbabilityLow}% and {b.eventProbabilityHigh}%). A typical event costs {money(b.typicalLoss)}; a severe one {money(b.severeLoss)}.
                  </>
                ) : (
                  "Larger organisations are attacked more often and lose more per event."
                )}
              </p>
            </Field>

            <Field label="Loss events in the last 12 months">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="One fewer loss event"
                  onClick={() => set({ lossEvents: Math.max(0, draft.lossEvents - 1) })}
                  disabled={!canEdit || draft.lossEvents === 0}
                  className="h-8 w-8 shadow-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={draft.lossEvents}
                  onChange={(e) => set({ lossEvents: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  disabled={!canEdit}
                  aria-label="Loss events in the last 12 months"
                  className={`w-16 text-center ${inputClass}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="One more loss event"
                  onClick={() => set({ lossEvents: draft.lossEvents + 1 })}
                  disabled={!canEdit}
                  className="h-8 w-8 shadow-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="mt-1.5 text-[12px] text-neutral-500">
                Attacks that got past your controls and cost real money: a ransom, downtime, a breach notification. Each one lowers your
                measured control effectiveness. Leave at 0 if there were none.
              </p>
            </Field>
          </div>
        </Panel>

        <Panel icon={DollarSign} title="Security investment" subtitle="Compared against loss avoided">
          <div className="p-3 space-y-3">
            <Field label="Annual spend">
              <div className="flex items-center gap-3">
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[13px]">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="e.g. 700000"
                    value={draft.investment || ""}
                    onChange={(e) => set({ investment: Math.max(0, Number(e.target.value) || 0) })}
                    disabled={!canEdit}
                    aria-label="Annual security spend in dollars"
                    className={`pl-7 ${inputClass}`}
                  />
                </div>
                <span className="text-[13px] text-neutral-500">per year</span>
              </div>
              <p className="mt-1.5 text-[12px] text-neutral-500">
                {draft.investment > 0
                  ? `${money(draft.investment)} a year, ${money(draft.investment / 4)} a quarter. `
                  : "Net benefit and ROI stay at zero until this is set. "}
                Include detection and response tooling, SOC staff or a managed service.
              </p>
            </Field>
          </div>
        </Panel>

        {/* The one assumption the user can change, kept out of the way */}
        <section className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAssumption(!showAssumption)}
            aria-expanded={showAssumption}
            className="w-full flex items-center gap-2 h-10 px-3 text-left hover:bg-neutral-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-[13px] font-medium text-neutral-900">Model assumption</span>
            <span className="text-[13px] text-neutral-400 truncate">· Typical control effectiveness {typical}%{draft.typicalPct === null ? " (default)" : ""}</span>
            <ChevronDown className={`ml-auto w-3.5 h-3.5 text-neutral-400 shrink-0 ${showAssumption ? "rotate-180" : ""}`} />
          </button>
          {showAssumption && (
            <div className="p-3 space-y-3 border-t border-neutral-200">
              <p className="text-[13px] text-neutral-500">
                The share of serious attacks a typical organisation&apos;s controls stop before they cause a loss. Published losses are the ones
                that got through, so this sets how much larger your exposure would be with no detection and response at all.
              </p>
              <Field label="Typical control effectiveness">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={MIN_TYPICAL}
                    max={MAX_TYPICAL}
                    step={5}
                    value={typical}
                    onChange={(e) => set({ typicalPct: Number(e.target.value) })}
                    disabled={!canEdit}
                    aria-label="Typical control effectiveness, percent"
                    className="flex-1 max-w-xs accent-neutral-900"
                  />
                  <span className="w-10 text-[13px] font-medium tabular-nums text-neutral-900">{typical}%</span>
                  {draft.typicalPct !== null && canEdit && (
                    <button type="button" onClick={() => set({ typicalPct: null })} className="text-[12px] text-neutral-700 underline underline-offset-2">
                      Reset to {defaultTypical}%
                    </button>
                  )}
                </div>
              </Field>
              <p className="text-[12px] text-neutral-500">
                This is the model&apos;s most influential number and its evidence is thin: surveys put attacks stopped before damage at roughly 21–44%,
                which is why the default is {defaultTypical}%. Raising it raises every dollar figure, so change it only if you can defend the new value.
              </p>
            </div>
          )}
        </section>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={save} disabled={saving || !dirty} className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            {dirty && (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setDraft(saved); setMessage(null); }} disabled={saving} className="text-sm">
                  Discard
                </Button>
                <Tag tone="yellow">Unsaved changes</Tag>
              </>
            )}
            {message && <span className={`text-[13px] ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</span>}
          </div>
        ) : (
          <p className="text-[12px] text-neutral-400">Only administrators can change settings.</p>
        )}
      </div>

      {/* ── What they produce ────────────────────────────────────────── */}
      <Panel
        icon={Calculator}
        title="Effect on your figures"
        subtitle={preview ? `Full year ${preview.year}` : "Calculating"}
        action={
          <div className="flex items-center gap-2">
            {previewing && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />}
            {preview?.usingSampleData && <Tag tone="yellow">Demo data</Tag>}
            {dirty ? <Tag tone="blue">Preview</Tag> : <Tag tone="green">Saved</Tag>}
          </div>
        }
        className="xl:sticky xl:top-0"
      >
        {rows.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="h-8 px-3 text-left text-[12px] font-normal text-neutral-500 bg-neutral-50 border-b border-neutral-200">Figure</th>
                <th className="h-8 px-3 text-right text-[12px] font-normal text-neutral-500 bg-neutral-50 border-b border-neutral-200">Value</th>
                <th className="h-8 px-3 text-left text-[12px] font-normal text-neutral-500 bg-neutral-50 border-b border-neutral-200 hidden sm:table-cell">Set by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className={`${td} h-auto py-2`}>
                    <div className={row.strong ? "font-medium" : "text-neutral-600"}>{row.label}</div>
                    {row.note && <div className="text-[12px] text-neutral-400">{row.note}</div>}
                  </td>
                  <td className={`${td} h-auto py-2 text-right tabular-nums whitespace-nowrap ${row.strong ? "font-semibold" : ""} ${row.negative ? "text-red-600" : ""}`}>
                    {row.value}
                  </td>
                  <td className={`${td} h-auto py-2 text-[12px] text-neutral-400 hidden sm:table-cell`}>{row.setBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="px-3 py-2 border-t border-neutral-200 text-[12px] text-neutral-500">
          {dirty
            ? "This is a preview. The dashboard keeps its current figures until you save."
            : "These are the figures the dashboard is using for the year."}
          {b?.assumed && " Your revenue is not set, so a mid-sized organisation is assumed."}
        </p>
      </Panel>
    </div>
  );
}
