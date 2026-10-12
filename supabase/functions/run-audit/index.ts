import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isPrivateIPv4(host: string) {
  const parts = host.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return false;
  const nums = parts.map(Number);
  if (nums.some((n) => n < 0 || n > 255)) return true;
  const [a, b] = nums;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}

function validateUrl(input: unknown): URL {
  if (typeof input !== "string" || input.length > 2048) throw new Error("Enter a URL under 2,048 characters.");
  let url: URL;
  try { url = new URL(input.trim().includes("://") ? input.trim() : `https://${input.trim()}`); }
  catch { throw new Error("Enter a valid website URL, such as https://example.com."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
  if (url.username || url.password) throw new Error("URLs with embedded credentials are not allowed.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".test") || host.endsWith(".invalid") ||
      host === "metadata.google.internal" || host === "host.docker.internal") {
    throw new Error("Local and internal hostnames are not allowed.");
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:") || isPrivateIPv4(host)) {
    throw new Error("Private and local IP addresses are not allowed.");
  }
  if (!host.includes(".") && !host.includes(":")) throw new Error("Enter a public website domain.");
  url.hash = "";
  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json().catch(() => null);
    const url = validateUrl(body?.url);

    // The demo delegates page fetching to Google's PageSpeed service; this function does
    // not directly fetch user-provided hosts. Network egress restrictions are still needed
    // before adding any direct crawler or redirect-following fetch implementation.
    const apiKey = Deno.env.get("PAGESPEED_API_KEY");
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url.toString());
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.append("category", "performance");
    endpoint.searchParams.append("category", "seo");
    endpoint.searchParams.append("category", "accessibility");
    if (apiKey) endpoint.searchParams.set("key", apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let response: Response;
    try {
      response = await fetch(endpoint, { signal: controller.signal, headers: { "Accept": "application/json" } });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const status = response.status;
      if (status === 429) return json({ error: "The audit service is busy. Please try again later." }, 429);
      return json({ error: status === 400 ? "Google could not audit that URL. Check that it is publicly accessible." : "The performance audit provider returned an error. Please try again later." }, 502);
    }
    const raw = await response.json();
    const lighthouse = raw?.lighthouseResult;
    if (!lighthouse?.categories) return json({ error: "No Lighthouse results were returned for this URL." }, 502);

    const categories = {};
    for (const name of ["performance", "seo", "accessibility"]) {
      const score = lighthouse.categories[name]?.score;
      categories[name] = { score: typeof score === "number" ? Math.round(score * 100) : null };
    }

    const findings = [];
    const audits = lighthouse.audits || {};
    const recommendations = [
      ["largest-contentful-paint", "Improve loading experience", "Review Largest Contentful Paint and follow the diagnostic details.", 2500, "High"],
      ["cumulative-layout-shift", "Reduce unexpected layout shifts", "Identify elements that move after the page starts rendering.", 0.1, "Medium"],
      ["meta-description", "Review the meta description", "Add a useful, page-specific description where appropriate.", null, "Medium"],
      ["document-title", "Review the page title", "Make sure the document title is descriptive and unique.", null, "High"],
      ["image-alt", "Check image alternative text", "Provide meaningful alt text for informative images.", null, "Medium"],
      ["link-text", "Make link text descriptive", "Use link labels that communicate their destination or purpose.", null, "Low"],
      ["viewport", "Check mobile viewport configuration", "Ensure the page has a suitable viewport for mobile devices.", null, "Medium"],
    ];
    for (const [id, title, detail, threshold, level] of recommendations) {
      const audit = audits[id];
      if (!audit || audit.score === null || audit.score === undefined || audit.score >= 0.9) continue;
      const measured = typeof audit.numericValue === "number" ? audit.numericValue : null;
      if (threshold !== null && measured !== null && id === "largest-contentful-paint" && measured <= threshold) continue;
      if (threshold !== null && measured !== null && id === "cumulative-layout-shift" && measured <= threshold) continue;
      findings.push({
        id,
        title: audit.title || title,
        detail: audit.description ? String(audit.description).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").slice(0, 400) : detail,
        level,
      });
    }
    findings.sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.level] - { High: 0, Medium: 1, Low: 2 }[b.level]));

    return json({
      url: url.toString(),
      generatedAt: new Date().toISOString(),
      categories,
      findings: findings.slice(0, 10),
      environment: { strategy: "mobile", provider: "Google PageSpeed Insights / Lighthouse" },
      limitations: ["Scores vary between runs.", "This report is a diagnostic snapshot, not a search ranking prediction.", "This demo does not yet save reports or enforce account quotas."],
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected audit error." }, 400);
  }
});