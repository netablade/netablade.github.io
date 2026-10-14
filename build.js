// BUILD: writes index.html from clips.json (made by ai-video/make_web.sh), order.json (category names and which
// clips come first) and meta.json (each clip's shown title and hover description). Run after changes:  node build.js
const fs = require("fs");
const path = require("path");

// SETTINGS
const NAME = "netablade";
const TITLE = "netablade's portfolio";
const BIO = {
	kicker: "Roblox scripting & UI · 4 years of experience",
	focus: "UI, combat, shops & data systems",
	tagline: "↳ If you can imagine it, I can script it",
};
const COMMISSIONS_OPEN = true; // (false shows "Closed")
const NOTE = "Animations and some assets come from my teammates and free resources. All scripting, UI components and everything else are made by me.";
const AI = {
	question: "Do I work with AI?",
	lead: "Yes, but as a tool, not a replacement.",
	body: "I use Claude to speed up the work; the systems, the code that ships and the final quality are mine.",
	options: [
		["With AI", "If you're fine with AI-assisted work, I deliver about 3 to 4 times faster."],
		["Without AI", "If you'd rather I don't use it, just say so: you'll get the same quality, written entirely by hand."],
	],
};
const DISCORD = "netablade"; // (the buttons copy it, since Discord has no public profile link by name)
// The 25 languages of the language picker: [Google Translate code, name in that language]
const LANGUAGES = [
	["en", "English"], ["es", "Español"], ["pt", "Português"], ["fr", "Français"], ["de", "Deutsch"],
	["it", "Italiano"], ["ru", "Русский"], ["tr", "Türkçe"], ["ar", "العربية"], ["hi", "हिन्दी"],
	["id", "Bahasa Indonesia"], ["ja", "日本語"], ["ko", "한국어"], ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"],
	["vi", "Tiếng Việt"], ["th", "ไทย"], ["pl", "Polski"], ["nl", "Nederlands"], ["uk", "Українська"],
	["tl", "Filipino"], ["ms", "Bahasa Melayu"], ["sv", "Svenska"], ["ro", "Română"], ["cs", "Čeština"],
];

// Icons (Discord's logo from Simple Icons, CC0; the rest drawn here)
const ICON = {
	discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.618-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
	sun: '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>',
	moon: '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a.6.6 0 0 0-.8-.7A9.6 9.6 0 1 0 21.1 15.4a.6.6 0 0 0-.7-.8z"/></svg>',
	globe: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg>',
	search: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
	chevron: '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
	info: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
};

const here = __dirname;
const read = (file) => JSON.parse(fs.readFileSync(path.join(here, file), "utf8"));
const clips = read("clips.json");
const order = read("order.json");
const meta = read("meta.json");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

// each category's clips: the ones in "first" in that order, then the rest by name
const sections = order.categories.map((cat) => {
	const list = clips.filter((c) => c.category === cat.folder).map((c) => {
		const m = meta[`${c.category}/${c.title}`] || {};
		return { ...c, name: m.title || titleCase(c.title), desc: m.desc || "" };
	});
	const first = order.first[cat.folder] || [];
	list.sort((a, b) => {
		const ia = first.indexOf(a.title), ib = first.indexOf(b.title);
		if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
		return a.title.localeCompare(b.title);
	});
	return { ...cat, list };
}).filter((s) => s.list.length > 0);
const total = sections.reduce((n, s) => n + s.list.length, 0);

const pills = [`<button class="pill active" data-filter="all">All</button>`]
	.concat(sections.map((s) => `<button class="pill" data-filter="${s.id}">${esc(s.name)}</button>`))
	.join("\n\t\t\t\t\t");

const body = sections.map((s) => `
		<section id="${s.id}" data-category="${s.id}">
			<h2>${esc(s.name)}</h2>
			<div class="feature collapsed">${s.list.map((c, i) => `
				<article class="clip ${i === 0 ? "big" : "small"}" data-video="${esc(c.video)}" data-search="${esc((c.name + " " + c.desc + " " + s.name).toLowerCase())}">
					<div class="frame">
						<div class="media"><video muted loop playsinline disablepictureinpicture preload="none" poster="${esc(c.poster)}" data-src="${esc(c.medium || c.small || c.video)}"></video></div>
						<div class="about"><p>${esc(c.desc)}</p></div>
					</div>
					<div class="text"><h3 class="title">${esc(c.name)}</h3><p class="desc">${esc(c.desc)}</p></div>
				</article>`).join("")}
			</div>${s.list.length > 3 ? `
			<button class="more" data-more="See all" data-less="Show less">See all</button>` : ""}
		</section>`).join("\n");

const languages = LANGUAGES.map(([code, name]) =>
	`<li><button data-lang="${code}"${code === "en" ? ' class="current"' : ""}><span class="notranslate">${esc(name)}</span></button></li>`).join("");

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${esc(TITLE)}</title>
	<meta name="description" content="${esc(BIO.kicker + ". " + BIO.focus + ".")}">
	<meta name="theme-color" content="#000000">
	<script>
		// (the theme is set before anything draws: dark unless the visitor picked light)
		try { if (localStorage.getItem("theme") === "light") document.documentElement.dataset.theme = "light"; } catch (e) {}
	</script>
	<link rel="icon" href="img/avatar.webp">
	<link rel="stylesheet" href="style.css">
</head>
<body>
	<header class="topbar">
		<div class="inner">
			<a class="brand notranslate" href="#"><img class="avatar" src="img/avatar.webp" alt="" width="32" height="32">${esc(NAME)}</a>
			<nav class="tools">
				<a class="nav-link" href="#ai">${esc(AI.question)}</a>
				<div class="lang">
					<button class="icon-button lang-button" aria-label="Language" aria-haspopup="true">${ICON.globe}<span class="lang-code notranslate">EN</span>${ICON.chevron}</button>
					<ul class="lang-menu" role="menu">${languages}</ul>
				</div>
				<button class="icon-button theme-button" aria-label="Light or dark">${ICON.sun}${ICON.moon}</button>
				<button class="discord small" data-copy="${esc(DISCORD)}" title="Copy my Discord name">${ICON.discord}<span class="name notranslate">${esc(DISCORD)}</span></button>
			</nav>
		</div>
	</header>

	<div class="hero">
		<h1 class="reveal">${esc(TITLE)}</h1>
		<div class="profile reveal">
			<div class="profile-main">
				<p class="kicker">${esc(BIO.kicker)}</p>
				<p class="focus">${esc(BIO.focus)}</p>
				<p class="tagline">${esc(BIO.tagline)}</p>
			</div>
			<div class="profile-side">
				<span class="label">Commissions</span>
				<span class="state ${COMMISSIONS_OPEN ? "open" : "closed"}"><span class="dot"></span>${COMMISSIONS_OPEN ? "Open" : "Closed"}</span>
			</div>
			<p class="profile-note">${ICON.info}<span>${esc(NOTE)}</span></p>
		</div>
	</div>

	<div class="filters" id="work">
		<div class="inner">
			<label class="search">${ICON.search}<input type="search" placeholder="Search clips" aria-label="Search clips" autocomplete="off"></label>
			<div class="pills">
				<span class="glider" aria-hidden="true"></span>
					${pills}
			</div>
		</div>
	</div>

	<main>${body}
		<p class="empty" hidden>No clips match that search.</p>
	</main>

	<section class="ai" id="ai">
		<div class="ai-card reveal">
			<h2>${esc(AI.question)}</h2>
			<div class="ai-text">
				<p class="lead">${esc(AI.lead)}</p>
				<p class="body">${esc(AI.body)}</p>
				<div class="ai-options">${AI.options.map(([label, text]) => `
					<div class="option"><span class="option-label">${esc(label)}</span><p>${esc(text)}</p></div>`).join("")}
				</div>
			</div>
		</div>
	</section>

	<footer>
		<div class="inner">
			<p class="copyright">© ${new Date().getFullYear()} <span class="notranslate">${esc(NAME)}</span> · All rights reserved</p>
		</div>
	</footer>

	<div class="viewer" id="viewer" aria-hidden="true">
		<button class="close" aria-label="Close">×</button>
		<div class="viewer-box">
			<video controls loop playsinline muted></video>
			<h3 class="caption"></h3>
			<p class="viewer-desc"></p>
		</div>
	</div>

	<div id="google_translate_element" hidden></div>
	<script src="script.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(here, "index.html"), html);
console.log(`index.html: ${sections.length} categories, ${total} clips`);
