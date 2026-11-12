import fs from "node:fs";
import jpeg from "jpeg-js";

// Read width/height from a JPEG or PNG header, so <img> tags can reserve their space.
const sizeCache = new Map();
function imageSize(url) {
  if (sizeCache.has(url)) return sizeCache.get(url);
  let out = null;
  try {
    const buf = fs.readFileSync("src" + decodeURI(url));
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      out = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    } else if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
          out = { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
          break;
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch (e) {}
  sizeCache.set(url, out);
  return out;
}

// Book covers for the Shelf page. Before each build, look each book up on Open Library and save
// its cover to src/images/covers/auto/. If that fails (offline, no match), the page draws a plain
// typographic cover instead, so the build never breaks. An uploaded cover in the admin page wins.
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
async function fetchCovers() {
  const dir = "src/images/covers/auto";
  fs.mkdirSync(dir, { recursive: true });
  let books = [];
  try { books = JSON.parse(fs.readFileSync("src/_data/shelf.json")).books || []; } catch (e) { return; }
  await Promise.all(books.map(async (b) => {
    if (b.cover || b.lookup === false || !b.title) return;
    const file = `${dir}/${slug(b.title)}.jpg`;
    if (fs.existsSync(file)) return;
    try {
      let id = null;
      if (b.olcover) {
        id = "id/" + String(b.olcover).replace(/[^0-9]/g, "");
      } else if (b.isbn) {
        id = "isbn/" + String(b.isbn).replace(/[^0-9X]/gi, "");
      } else {
        const q = new URLSearchParams({ title: b.title, limit: "5", fields: "cover_i" });
        if (b.author) q.set("author", b.author.split(/ and |,/)[0]);
        const res = await fetch("https://openlibrary.org/search.json?" + q, { signal: AbortSignal.timeout(8000) });
        const doc = ((await res.json()).docs || []).find((d) => d.cover_i);
        if (doc) id = "id/" + doc.cover_i;
      }
      if (!id) return;
      const img = await fetch(`https://covers.openlibrary.org/b/${id}-L.jpg?default=false`, { signal: AbortSignal.timeout(10000) });
      if (!img.ok) return;
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length > 2000) fs.writeFileSync(file, buf);
    } catch (e) {}
  }));
}

export default function (eleventyConfig) {
  eleventyConfig.on("eleventy.before", fetchCovers);
  // Spine for a Shelf book: height/width vary per title (stable), colour from its cover (or a cloth colour)
  const CLOTHS = ["#5A3A2A", "#2E3A34", "#6B5A3E", "#3B2F4A", "#7A4A2A", "#2A3A4A", "#4A2A2A", "#3E4A2E"];
  const spineCache = new Map();
  function hash(s) { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
  function toHex(r, g, b) { return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""); }
  function coverColour(file) {
    try {
      const img = jpeg.decode(fs.readFileSync(file), { useTArray: true, maxMemoryUsageInMB: 256 });
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = Math.floor(img.height * 0.15); y < img.height * 0.85; y += 4)
        for (let x = Math.floor(img.width * 0.15); x < img.width * 0.85; x += 4) {
          const i = (y * img.width + x) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
        }
      r /= n; g /= n; b /= n;
      // Pull it into book-cloth territory: darker and a little muted, so cream text reads on it
      const max = Math.max(r, g, b) || 1, target = 92;
      const k = Math.min(1, target / max);
      const grey = (r + g + b) / 3;
      const mute = (v) => (v * 0.8 + grey * 0.2) * k;
      return toHex(mute(r), mute(g), mute(b));
    } catch (e) { return null; }
  }
  eleventyConfig.addFilter("spineOf", (b) => {
    const key = b.title || "";
    if (spineCache.has(key)) return spineCache.get(key);
    const h = hash(key);
    let c = b.spine || null;
    if (!c && !b.cover) {
      const file = `src/images/covers/auto/${slug(key)}.jpg`;
      if (fs.existsSync(file)) c = coverColour(file);
    }
    const out = { h: Math.min(98, 74 + (h % 16) + Math.max(0, key.length - 18) * 0.6), w: 38 + ((h >> 5) % 18), c: c || CLOTHS[h % CLOTHS.length], ink: "#EFE4D6" };
    spineCache.set(key, out);
    return out;
  });

  // Cover image for a Shelf book: uploaded cover, else the fetched one, else "" (typographic cover)
  eleventyConfig.addFilter("coverOf", (b) => {
    if (b.cover) return b.cover;
    const auto = `/images/covers/auto/${slug(b.title || "")}.jpg`;
    return fs.existsSync("src" + auto) ? auto : "";
  });

  // {{ p.image | dims | safe }} → width="…" height="…" (empty if the size can't be read)
  eleventyConfig.addFilter("dims", (url) => {
    const s = url && imageSize(url);
    return s ? `width="${s.w}" height="${s.h}"` : "";
  });

  for (const p of ["src/images", "src/files", "src/assets", "src/admin", "src/CNAME"]) {
    eleventyConfig.addPassthroughCopy(p);
  }

  // Both languages are written into the page; CSS shows the one that's selected.
  eleventyConfig.addShortcode("t", (en, cy) =>
    `<span class="l-en" lang="en">${en}</span><span class="l-cy" lang="cy">${cy || en}</span>`
  );

  // Featured essays: match the URLs picked in the admin page to posts from the Substack feed.
  // If none are picked, show the three latest posts.
  eleventyConfig.addFilter("featuredPosts", (writing, posts) => {
    const picked = (writing && writing.featured) || [];
    if (!picked.length) return posts.slice(0, 3);
    return picked
      .map((f) => {
        const clean = (u) => (u || "").split("?")[0].replace(/\/$/, "");
        const post = posts.find((p) => clean(p.url) === clean(f.url));
        if (!post) return null;
        return { ...post, subtitle: f.blurb || post.subtitle };
      })
      .filter(Boolean);
  });

  // Photos with a map pin, as plain data for the map script.
  eleventyConfig.addFilter("mapPoints", (photos) =>
    (photos || []).flatMap((p) => {
      if (!p.location) return [];
      try {
        const g = typeof p.location === "string" ? JSON.parse(p.location) : p.location;
        const [lng, lat] = g.coordinates;
        return [{ image: p.image, caption: p.caption || "", lat, lng }];
      } catch (e) { return []; }
    })
  );
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));

  eleventyConfig.addFilter("currentEntries", (cv) =>
    cv.sections.flatMap((s) => s.entries.filter((e) => e.current))
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
