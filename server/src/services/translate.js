const USER_AGENT = "Mozilla/5.0 (compatible; SocialStore/1.0)";
const REQUEST_MS = 8000;

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

function looksUnusable(text) {
  const value = String(text || "").trim();
  if (!value) return true;
  if (value.startsWith("<")) return true;
  return /MYMEMORY WARNING|QUERY LENGTH LIMIT|NO QUERY SPECIFIED|PLEASE SELECT TWO DISTINCT|IS AN INVALID LANGUAGE/i.test(
    value,
  );
}

function usableTranslation(source, translated) {
  if (looksUnusable(translated)) return false;
  const out = String(translated).trim();
  if (hasArabic(out)) return true;
  const src = String(source || "").trim();
  if (out && out !== src) return true;
  return Boolean(out && !hasArabic(src) && src.split(/\s+/).length <= 4);
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...(options.headers || {}),
      },
    });
    const raw = await response.text();
    try {
      return { ok: response.ok, data: JSON.parse(raw) };
    } catch {
      return { ok: false, data: null };
    }
  } finally {
    clearTimeout(timer);
  }
}

async function viaMyMemory(chunk) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en%7Car&de=global2stor2@gmail.com`;
  const { data } = await fetchJson(url);
  const translated = data?.responseData?.translatedText;
  return usableTranslation(chunk, translated) ? String(translated).trim() : null;
}

async function viaGoogle(chunk) {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=ar&q=${encodeURIComponent(chunk)}`;
  const { data } = await fetchJson(url);
  let translated = "";
  if (Array.isArray(data)) {
    translated = typeof data[0] === "string" ? data[0] : data[0]?.[0] || "";
  }
  return usableTranslation(chunk, translated) ? String(translated).trim() : null;
}

async function viaLingva(chunk) {
  const url = `https://lingva.ml/api/v1/en/ar/${encodeURIComponent(chunk)}`;
  const { data } = await fetchJson(url);
  const translated = data?.translation;
  return usableTranslation(chunk, translated) ? String(translated).trim() : null;
}

const PROVIDERS = [viaMyMemory, viaGoogle, viaLingva];

async function translateChunk(chunk) {
  const source = String(chunk || "");
  const trimmed = source.trim();
  if (!trimmed) return source;
  if (!/[A-Za-z]/.test(trimmed)) return source;

  let lastError = null;
  for (const provider of PROVIDERS) {
    try {
      const translated = await provider(trimmed);
      if (translated) return translated;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Translation service is unavailable");
}

function splitLongLine(line) {
  if (line.length <= 400) return [line];
  const parts = line.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";
  for (const part of parts) {
    if ((current ? `${current} ${part}` : part).length > 400 && current) {
      chunks.push(current);
      current = part;
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function translateEnglishToArabic(text) {
  const source = String(text || "").trim();
  if (!source) {
    throw new Error("Text is required");
  }

  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  for (const line of lines) {
    if (!line.trim() || !/[A-Za-z]/.test(line)) {
      out.push(line);
      continue;
    }
    const pieces = [];
    for (const piece of splitLongLine(line)) {
      pieces.push(await translateChunk(piece));
    }
    out.push(pieces.join(" "));
  }
  return out.join("\n").trim();
}
