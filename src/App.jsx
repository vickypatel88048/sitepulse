import { useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleHelp, Gauge, Globe2, LockKeyhole, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { runAudit } from "./lib/audit.js";

const sampleFindings = [
  { level: "High", title: "Improve page performance", detail: "Review opportunities reported by Lighthouse to reduce loading time.", color: "text-rose-300 bg-rose-400/10 border-rose-300/20" },
  { level: "Medium", title: "Review search appearance", detail: "Confirm the page title and meta description clearly describe this page.", color: "text-amber-200 bg-amber-400/10 border-amber-300/20" },
  { level: "Info", title: "Check image accessibility", detail: "Images that convey meaning should have useful alternative text.", color: "text-sky-200 bg-sky-400/10 border-sky-300/20" },
];

function scoreColor(score) {
  if (score >= 90) return "text-emerald-300";
  if (score >= 50) return "text-amber-200";
  return "text-rose-300";
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleAudit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const report = await runAudit(url);
      setResult(report);
    } catch (err) {
      setError(err?.message || "We couldn't audit that website. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const performance = result?.categories?.performance;
  const seo = result?.categories?.seo;
  const accessibility = result?.categories?.accessibility;
  const findings = result?.findings || [];

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="SitePulse home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><Activity size={22} strokeWidth={2.7}/></span>
          <span className="text-xl font-bold tracking-tight">sitepulse<span className="text-emerald-300">.</span></span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex" aria-label="Main navigation">
          <a className="transition hover:text-white" href="#features">Features</a>
          <a className="transition hover:text-white" href="#how-it-works">How it works</a>
          <a className="transition hover:text-white" href="#pricing">Pricing</a>
        </nav>
        <a href="#audit" className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:border-emerald-200/50 hover:bg-white/5">Run an audit <ArrowRight className="ml-2 inline" size={15}/></a>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:pb-28">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-300/[0.08] blur-[120px]"/>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/[0.06] px-4 py-2 text-xs font-semibold tracking-wide text-emerald-200 sm:text-sm"><Sparkles size={15}/> Clear answers for a healthier website</div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Your website deserves<br className="hidden sm:block"/> a <span className="text-emerald-300">pulse check.</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">Find performance and technical SEO issues, understand what matters, and leave with a clear next step. No jargon. Just useful signals.</p>
            <form id="audit" onSubmit={handleAudit} className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/20 sm:flex-row">
              <label htmlFor="website-url" className="sr-only">Website URL to audit</label>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Globe2 className="shrink-0 text-slate-400" size={20}/><input id="website-url" type="text" inputMode="url" autoComplete="url" maxLength={2048} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter your website, e.g. example.com" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500" required/></div>
              <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900"/> Auditing…</> : <>Audit website <ArrowRight size={17}/></>}</button>
            </form>
            <p className="mt-4 text-xs text-slate-500"><LockKeyhole className="mr-1 inline" size={12}/> Public URLs only · No password required for this demo</p>
            {error && <div role="alert" className="mx-auto mt-5 max-w-2xl rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-left text-sm text-rose-200">{error}</div>}
          </div>

          {result ? (
            <section aria-live="polite" className="mx-auto mt-14 max-w-5xl rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Audit report</p><h2 className="mt-2 break-all text-xl font-semibold">{result.url}</h2><p className="mt-1 text-sm text-slate-400">Generated {new Date(result.generatedAt || Date.now()).toLocaleString()}</p></div><button onClick={() => { navigator.clipboard?.writeText(window.location.href); }} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Copy page link</button></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[["Performance", performance], ["SEO", seo], ["Accessibility", accessibility]].map(([label, item]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-3 text-4xl font-semibold ${scoreColor(item?.score ?? 0)}`}>{item?.score == null ? "—" : Math.round(item.score)}<span className="ml-1 text-sm text-slate-500">/100</span></p><p className="mt-2 text-xs text-slate-500">{item?.score == null ? "Not available" : item.score >= 90 ? "Good" : item.score >= 50 ? "Needs improvement" : "Needs attention"}</p></div>)}
              </div>
              <h3 className="mt-8 text-lg font-semibold">Recommended next steps</h3>
              <div className="mt-4 space-y-3">{findings.length ? findings.map((finding, index) => <div key={finding.id || index} className="flex gap-3 rounded-2xl border border-white/10 p-4"><span className={`mt-0.5 h-fit rounded-lg border px-2 py-1 text-[11px] font-semibold ${finding.level === "High" ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : finding.level === "Medium" ? "border-amber-300/20 bg-amber-400/10 text-amber-100" : "border-sky-300/20 bg-sky-400/10 text-sky-200"}`}>{finding.level}</span><div><p className="font-medium">{finding.title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{finding.detail}</p></div></div>) : <p className="text-sm text-slate-400">No prioritized recommendations were returned. Review the category scores and the source diagnostics.</p>}</div>
              <p className="mt-5 text-xs leading-5 text-slate-500">Scores are Lighthouse lab measurements and may vary by run, device emulation, network, and page state. They are not a guarantee of search ranking.</p>
              <button onClick={() => { setResult(null); setUrl(""); }} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100">Run another audit <ArrowRight size={15}/></button>
            </section>
          ) : (
            <div className="mx-auto mt-16 max-w-5xl rounded-3xl border border-white/10 bg-[#10172a]/90 p-4 shadow-2xl shadow-black/20 sm:mt-20 sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-300/80"/><span className="h-2.5 w-2.5 rounded-full bg-amber-200/80"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-200/80"/></div><span className="text-xs text-slate-500">sitepulse.app / overview</span><span className="rounded-full border border-emerald-200/20 px-3 py-1 text-[11px] text-emerald-200">Preview</span></div>
              <div className="grid gap-5 py-5 sm:grid-cols-[1.05fr_1fr] sm:py-7">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Website health</p><p className="mt-1 text-xs text-slate-600">Illustrative preview</p></div><Gauge className="text-emerald-200" size={20}/></div><div className="mt-8 flex items-center gap-6"><div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{background:"conic-gradient(#6ee7b7 0deg 288deg, #263249 288deg 360deg)"}}><div className="grid h-24 w-24 place-items-center rounded-full bg-[#10172a]"><span className="text-3xl font-semibold">80<span className="text-sm text-slate-500">/100</span></span></div></div><div className="space-y-3 text-sm"><div><span className="text-emerald-200">●</span><span className="ml-2 text-slate-300">Performance</span></div><div><span className="text-sky-200">●</span><span className="ml-2 text-slate-300">SEO basics</span></div><div><span className="text-amber-200">●</span><span className="ml-2 text-slate-300">Accessibility</span></div></div></div><p className="mt-6 text-xs leading-5 text-slate-500">Sample UI only. Enter a URL above to request a live audit.</p></div>
                <div className="space-y-3">{sampleFindings.map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{item.title}</p><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${item.color}`}>{item.level}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p></div>)}</div>
              </div>
            </div>
          )}
        </section>

        <section id="features" className="border-y border-white/[0.07] bg-white/[0.018]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-emerald-200">LESS GUESSWORK, MORE PROGRESS</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to spot the next fix.</h2><p className="mt-4 leading-7 text-slate-400">A focused toolkit for freelancers and small teams who want clear findings without a maze of dashboards.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[{icon:Gauge,title:"Performance signals",desc:"Review Lighthouse performance metrics and learn which opportunities are worth investigating."},{icon:Search,title:"Technical SEO basics",desc:"Inspect core on-page signals and identify areas that need a closer look."},{icon:ShieldCheck,title:"Actionable reports",desc:"Turn diagnostic results into a short, understandable list of next steps."}].map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-[#10172a] p-6"><item.icon className="text-emerald-200" size={23}/><h3 className="mt-5 font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p></article>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="text-center"><p className="text-sm font-semibold text-emerald-200">THREE SIMPLE STEPS</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From URL to action plan.</h2></div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">{[{n:"01",title:"Enter a URL",desc:"Start with a publicly accessible website you manage or have permission to audit."},{n:"02",title:"Review the signals",desc:"Get available performance and SEO diagnostics in one place."},{n:"03",title:"Prioritize a fix",desc:"Use the findings to decide what to investigate or improve next."}].map((step) => <div key={step.n} className="border-t border-white/15 pt-5"><p className="text-sm font-semibold text-emerald-200">{step.n}</p><h3 className="mt-4 text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{step.desc}</p></div>)}</div>
        </section>

        <section id="pricing" className="border-y border-white/[0.07] bg-white/[0.018]">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:py-24">
            <div className="text-center"><p className="text-sm font-semibold text-emerald-200">SIMPLE, EARLY ACCESS</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Start free. Upgrade when it helps.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">Pricing is a proposed plan, not a live subscription offer. Billing will be enabled after the MVP and payment flow are tested.</p></div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#10172a] p-7"><p className="text-sm font-semibold text-slate-300">Free</p><p className="mt-4 text-4xl font-semibold">₹0<span className="ml-2 text-sm font-normal text-slate-500">/ month</span></p><p className="mt-3 text-sm text-slate-400">Explore the core audit experience.</p><ul className="mt-6 space-y-3 text-sm text-slate-300">{["3 audits per month (planned)","Performance and SEO signals","Clear recommendations"].map((x)=><li key={x} className="flex gap-2"><Check className="text-emerald-200" size={17}/>{x}</li>)}</ul><a href="#audit" className="mt-8 block rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold hover:bg-white/5">Try the demo <ArrowRight className="ml-1 inline" size={15}/></a></div>
              <div className="relative rounded-2xl border border-emerald-200/35 bg-emerald-200/[0.045] p-7"><span className="absolute right-5 top-5 rounded-full bg-emerald-200/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">Planned</span><p className="text-sm font-semibold text-emerald-100">Pro</p><p className="mt-4 text-4xl font-semibold">₹999<span className="ml-2 text-sm font-normal text-slate-500">/ month</span></p><p className="mt-3 text-sm text-slate-400">For freelancers managing client websites.</p><ul className="mt-6 space-y-3 text-sm text-slate-300">{["50 audits per month (planned)","Saved audit history","Client-ready report options"].map((x)=><li key={x} className="flex gap-2"><Check className="text-emerald-200" size={17}/>{x}</li>)}</ul><a href="mailto:hello@sitepulse.example?subject=SitePulse%20early%20access" className="mt-8 block rounded-xl bg-emerald-300 px-4 py-3 text-center text-sm font-bold text-slate-950 hover:bg-emerald-200">Ask about early access <ArrowRight className="ml-1 inline" size={15}/></a></div>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><a href="#" className="font-semibold text-slate-300">sitepulse<span className="text-emerald-300">.</span></a><p>Diagnostics, not guarantees. Lighthouse scores can vary and do not predict search rankings.</p><a href="mailto:hello@sitepulse.example" className="hover:text-white">Contact</a></footer>
    </div>
  );
}