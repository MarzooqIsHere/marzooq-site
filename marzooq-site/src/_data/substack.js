// Pulls the latest posts from Substack when the site is built.
// If Substack can't be reached, it falls back to substack_cache.json so the build never breaks.
import fs from "node:fs";

const FEED = "https://groundedbymarzooq.substack.com/feed";

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}

export default async function () {
  const cache = JSON.parse(fs.readFileSync(new URL("./substack_cache.json", import.meta.url)));
  try {
    const res = await fetch(FEED, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, b]) => {
      const enc = b.match(/<enclosure[^>]*url="([^"]+)"/);
      return {
        title: decode(pick(b, "title")),
        url: pick(b, "link"),
        subtitle: decode(pick(b, "description")),
        cover: enc && !enc[1].includes("/youtube/") ? enc[1] : "",
        date: new Date(pick(b, "pubDate")).toISOString().slice(0, 10),
      };
    });
    if (!items.length) throw new Error("no items");
    // keep a cover from the cache if the feed has none
    for (const it of items) {
      const c = cache.find((x) => x.url === it.url);
      if (!it.cover && c && c.cover) it.cover = c.cover;
    }
    return items;
  } catch (e) {
    console.warn(`[substack] using cached posts (${e.message})`);
    return cache;
  }
}
