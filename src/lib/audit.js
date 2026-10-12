const forbiddenHostnames = new Set([
  "localhost", "localhost.localdomain", "metadata.google.internal",
  "metadata", "host.docker.internal"
]);

function isPrivateIPv4(host) {
  const parts = host.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const nums = parts.map(Number);
  if (nums.some((n) => n < 0 || n > 255)) return true;
  const [a, b] = nums;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}

export function validatePublicUrl(input) {
  if (typeof input !== "string" || input.length > 2048) {
    throw new Error("Enter a valid website URL (maximum 2,048 characters).");
  }
  let url;
  try { url = new URL(input.trim().includes("://") ? input.trim() : `https://${input.trim()}`); }
  catch { throw new Error("That URL doesn't look valid. Try example.com."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
  if (url.username || url.password) throw new Error("URLs containing usernames or passwords are not allowed.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || forbiddenHostnames.has(host) || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".test") || host.endsWith(".invalid")) {
    throw new Error("Local and internal hostnames cannot be audited.");
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:") || isPrivateIPv4(host)) {
    throw new Error("Private or local IP addresses cannot be audited.");
  }
  if (!host.includes(".") && host !== "google.com") throw new Error("Enter a public website domain, such as example.com.");
  url.hash = "";
  return url.toString();
}

export async function runAudit(input) {
  const url = validatePublicUrl(input);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes("YOUR_PROJECT")) {
    throw new Error("Connect Supabase and deploy the run-audit Edge Function to enable live audits. See README.md.");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const { data, error } = await createClient(supabaseUrl, import.meta.env.VITE_SUPABASE_ANON_KEY || "").functions.invoke("run-audit", {
    body: { url }
  });
  if (error) throw new Error(error.message || "Audit request failed.");
  if (!data || data.error) throw new Error(data?.error || "The audit service returned no results.");
  return data;
}