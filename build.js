// BUILD: writes index.html from clips.json (made by ai-video/make_web.sh) and order.json (category names and
// which clips come first). Run after adding or changing clips:  node build.js
const fs = require("fs");
const path = require("path");

// SETTINGS
const TITLE = "netablade's portfolio";
const INTRO = "Roblox scripter. Combat, guns, pets, movement and UI systems.";
const DISCORD = "netablade"; // (the buttons copy it, since Discord has no public profile link by name)
// The Discord logo (Simple Icons, CC0)
const DISCORD_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.618-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';

const here = __dirname;
const clips = JSON.parse(fs.readFileSync(path.join(here, "clips.json"), "utf8"));
const order = JSON.parse(fs.readFileSync(path.join(here, "order.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// each category's clips: the ones in "first" in that order, then the rest by name
const sections = order.categories.map((cat) => {
	const list = clips.filter((c) => c.category === cat.folder);
	const first = order.first[cat.folder] || [];
	list.sort((a, b) => {
		const ia = first.indexOf(a.title), ib = first.indexOf(b.title);
		if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
		return a.title.localeCompare(b.title);
	});
	return { ...cat, list };
}).filter((s) => s.list.length > 0);
const total = sections.reduce((n, s) => n + s.list.length, 0);

const pills = [`<button class="pill active" data-filter="all">All<span class="count">${total}</span></button>`]
	.concat(sections.map((s) => `<button class="pill" data-filter="${s.id}">${esc(s.name)}<span class="count">${s.list.length}</span></button>`))
	.join("\n\t\t\t");

const body = sections.map((s) => `
		<section id="${s.id}" data-category="${s.id}">
			<h2>${esc(s.name)}<span class="count">${s.list.length}</span></h2>
			<div class="grid">${s.list.map((c) => `
				<div class="clip" data-video="${esc(c.video)}" data-title="${esc(c.title)}">
					<div class="frame"><video muted loop playsinline preload="none" poster="${esc(c.poster)}" data-src="${esc(c.video)}"></video></div>
					<div class="title">${esc(c.title)}</div>
				</div>`).join("")}
			</div>
		</section>`).join("\n");

// the Discord buttons: a click copies the name
const discordSmall = `<button class="discord small" data-copy="${esc(DISCORD)}" title="Copy my Discord name">${DISCORD_LOGO}<span class="name">${esc(DISCORD)}</span></button>`;
const discordBig = `<button class="discord big" data-copy="${esc(DISCORD)}">${DISCORD_LOGO}<span class="label"><span class="hint">Message me on Discord</span><span class="name">${esc(DISCORD)}</span></span><span class="action">Copy</span></button>`;

const html = `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${esc(TITLE)}</title>
	<meta name="description" content="${esc(INTRO)}">
	<link rel="stylesheet" href="style.css">
</head>
<body>
	<header class="topbar">
		<div class="inner">
			<a class="brand" href="#">netablade</a>
			<nav class="nav"><a href="#work">Work</a>${discordSmall}</nav>
		</div>
	</header>

	<div class="hero">
		<h1>${esc(TITLE)}</h1>
		<div class="rule"></div>
		<p>${esc(INTRO)}</p>
		<div class="cta">${discordBig}</div>
	</div>

	<div class="filters" id="work">
		<div class="inner">
			${pills}
		</div>
	</div>

	<main>${body}
	</main>

	<footer id="contact">
		<div class="inner">
			<span>© ${new Date().getFullYear()} netablade</span>
			<span>Discord: ${esc(DISCORD)}</span>
		</div>
	</footer>

	<div class="viewer" id="viewer">
		<button class="close" aria-label="Close">×</button>
		<video controls loop playsinline muted></video>
		<div class="caption"></div>
	</div>

	<script src="script.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(here, "index.html"), html);
console.log(`index.html: ${sections.length} categories, ${total} clips`);
