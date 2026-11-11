export default function (eleventyConfig) {
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
