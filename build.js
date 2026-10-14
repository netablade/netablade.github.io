// BUILD: writes index.html from clips.json (made by ai-video/make_web.sh), order.json (category names and which
// clips come first) and meta.json (each clip's shown title and hover description). Run after changes:  node build.js
const fs = require("fs");
const path = require("path");

// SETTINGS
const NAME = "netablade";
const SITE_URL = "https://netablade.github.io";
const TITLE = "netablade's portfolio";
const BIO = {
	kicker: "Roblox scripting & UI · 4 years of experience", // (the link preview text)
	focus: "UI, combat, shops & data systems",
	tagline: "If you can imagine it, I can script it.",
	// the three facts under the title: value, then the small label under it
	years: "4 years", yearsLabel: "Roblox scripting & UI",
	chips: "UI · Combat · Shops · Data", chipsLabel: "What I build",
};
// the box next to "Do I work with AI?"
const TRIAL = {
	title: "Didn't find what you need?",
	lead: "Try me first, for free.",
	body: "Tell me your idea. If you like the free part, we build the rest together.",
	step: ["Free trial", "A small part of your system, scripted for free."],
	contact: "Message me",
};
const COMMISSIONS_OPEN = true; // (false shows "Closed")
const NOTE = "Animations and some assets come from my teammates and free resources. All scripting, UI components and everything else are made by me.";
const AI = {
	question: "Do I work with AI?",
	lead: "Yes, but as a tool, not a replacement.",
	body: "I use Claude to speed up the work; the systems, the code that ships and the final quality are mine.",
	options: [
		["With AI", "If you're fine with AI‑assisted work, I deliver about 3 to 4 times faster."],
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
	left: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
	right: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
	link: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>',
	info: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
};

const here = __dirname;
const read = (file) => JSON.parse(fs.readFileSync(path.join(here, file), "utf8"));
const clips = read("clips.json");
const order = read("order.json");
const meta = read("meta.json");
const i18n = read("i18n.json"); // (hand translations: each one gets its own page, tr/ es/ pt/)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
// a clip's own link: "Lock-On Targeting" -> #lock-on-targeting (always from the English title, so links work in every language)
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// what search matches against: lower case, accents dropped ("animación" = "animacion", "kırma" = "kirma"); script.js does the same
const fold = (s, lang) => s.toLocaleLowerCase(lang).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

// the English words of the page (the translations replace these by name)
const EN = {
	title: TITLE, kicker: BIO.kicker, focus: BIO.focus, tagline: BIO.tagline,
	years: BIO.years, yearsLabel: BIO.yearsLabel, chips: BIO.chips, chipsLabel: BIO.chipsLabel,
	trialTitle: TRIAL.title, trialLead: TRIAL.lead, trialBody: TRIAL.body, trialStep: TRIAL.step[0], trialStepText: TRIAL.step[1], contact: TRIAL.contact,
	commissions: "Commissions", open: "Open", closed: "Closed", commissionsOpen: "Commissions open.", note: NOTE,
	aiQuestion: AI.question, aiLead: AI.lead, aiBody: AI.body,
	withAI: AI.options[0][0], withAIText: AI.options[0][1], withoutAI: AI.options[1][0], withoutAIText: AI.options[1][1],
	all: "All", search: "Search clips", seeAll: "See all", showLess: "Show less", empty: "No clips match that search.",
	copyLink: "Copy link", copied: "Copied!", rights: "All rights reserved",
	language: "Language", theme: "Light or dark", copyDiscord: "Copy my Discord name", close: "Close", prev: "Previous clip", next: "Next clip",
};
const HAND = Object.keys(i18n).filter((k) => !k.startsWith("_"));

// each category's clips: the ones in "first" in that order, then the rest by name
const sections = order.categories.map((cat) => {
	const list = clips.filter((c) => c.category === cat.folder).map((c) => {
		const m = meta[`${c.category}/${c.title}`] || {};
		return { ...c, key: `${c.category}/${c.title}`, name: m.title || titleCase(c.title), desc: m.desc || "" };
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

function page(lang) {
	const tr = lang === "en" ? {} : i18n[lang];
	const t = (key) => (tr.ui && tr.ui[key]) || EN[key];
	const P = lang === "en" ? "" : "../"; // (the language pages sit one folder down)
	const pageUrl = `${SITE_URL}/${lang === "en" ? "" : lang + "/"}`;
	const description = `${t("kicker")}. ${t("focus")}.`;

	const pills = [`<button class="pill active" data-filter="all">${esc(t("all"))}</button>`]
		.concat(sections.map((s) => `<button class="pill" data-filter="${s.id}">${esc((tr.categories && tr.categories[s.id]) || s.name)}</button>`))
		.join("\n\t\t\t\t\t");

	const body = sections.map((s) => {
		const catName = (tr.categories && tr.categories[s.id]) || s.name;
		return `
		<section id="${s.id}" data-category="${s.id}">
			<h2>${esc(catName)}</h2>
			<div class="feature collapsed">${s.list.map((c, i) => {
				const [name, desc] = (tr.clips && tr.clips[c.key]) || [c.name, c.desc];
				// (search finds a clip by its translated words and its English ones)
				const words = fold([name, desc, catName].concat(lang === "en" ? [] : [c.name, c.desc, s.name]).join(" "), lang);
				return `
				<article class="clip ${i === 0 ? "big" : "small"}" id="${slug(c.name)}" data-video="${esc(P + c.video)}" data-search="${esc(words)}">
					<div class="frame">
						<div class="media"><video muted loop playsinline disablepictureinpicture preload="none" poster="${esc(P + c.poster)}" data-src="${esc(P + (c.medium || c.small || c.video))}"></video></div>
						<div class="about"><p>${esc(desc)}</p></div>
					</div>
					<div class="text"><h3 class="title">${esc(name)}</h3><p class="desc">${esc(desc)}</p></div>
				</article>`;
			}).join("")}
			</div>${s.list.length > 3 ? `
			<button class="more" data-more="${esc(t("seeAll"))}" data-less="${esc(t("showLess"))}">${esc(t("seeAll"))}</button>` : ""}
		</section>`;
	}).join("\n");

	// (the hand-translated languages open their own page; the rest go through Google Translate on the English one)
	const languages = LANGUAGES.map(([code, name]) =>
		`<li><button data-lang="${code}"${HAND.includes(code) ? ` data-page="${code}/"` : ""}${code === lang ? ' class="current"' : ""}><span class="notranslate">${esc(name)}</span></button></li>`).join("");
	const alternates = ["en"].concat(HAND).map((l) =>
		`<link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l === "en" ? "" : l + "/"}">`).join("\n\t") +
		`\n\t<link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`;

	return `<!doctype html>
<html lang="${lang}" data-theme="dark" data-root="${P}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${esc(t("title"))}</title>
	<meta name="description" content="${esc(description)}">
	<meta name="theme-color" content="#000000">
	<script>
		// (the theme is set before anything draws: dark unless the visitor picked light)
		try { if (localStorage.getItem("theme") === "light") document.documentElement.dataset.theme = "light"; } catch (e) {}${lang === "en" ? `
		// (someone who picked one of the hand-translated languages comes back to it)
		try { var l = localStorage.getItem("lang"); if (${JSON.stringify(HAND)}.indexOf(l) !== -1) location.replace(l + "/" + location.hash); } catch (e) {}` : ""}
	</script>
	<link rel="icon" href="${P}favicon.ico" sizes="any">
	<link rel="icon" type="image/png" sizes="32x32" href="${P}img/icon-32.png">
	<link rel="icon" type="image/png" sizes="192x192" href="${P}img/icon-192.png">
	<link rel="apple-touch-icon" href="${P}img/apple-touch-icon.png">
	${alternates}
	<!-- the card a shared link shows (Discord, Twitter...): the reel as a GIF, so Discord plays it by itself, looping
	     (a video there would wait for a click). Made by ai-video/reel/make_reel.sh; keep it under 8 MB. -->
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="${esc(NAME)}">
	<meta property="og:title" content="${esc(t("title"))}">
	<meta property="og:description" content="${esc(description + (COMMISSIONS_OPEN ? " " + t("commissionsOpen") : ""))}">
	<meta property="og:url" content="${pageUrl}">
	<meta property="og:image" content="${SITE_URL}/img/reel.gif">
	<meta property="og:image:type" content="image/gif">
	<meta property="og:image:width" content="500">
	<meta property="og:image:height" content="281">
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:image" content="${SITE_URL}/img/reel.gif">
	<link rel="stylesheet" href="${P}style.css">
</head>
<body>
	<header class="topbar">
		<div class="inner">
			<a class="brand notranslate" href="#"><img class="avatar" src="${P}img/avatar.webp" alt="" width="32" height="32">${esc(NAME)}</a>
			<nav class="tools">
				<a class="nav-link" href="#ai">${esc(t("aiQuestion"))}</a>
				<div class="lang">
					<button class="icon-button lang-button" aria-label="${esc(t("language"))}" aria-haspopup="true">${ICON.globe}<span class="lang-code notranslate">${lang.toUpperCase()}</span>${ICON.chevron}</button>
					<ul class="lang-menu" role="menu">${languages}</ul>
				</div>
				<button class="icon-button theme-button" aria-label="${esc(t("theme"))}">${ICON.sun}${ICON.moon}</button>
				<button class="discord small" data-copy="${esc(DISCORD)}" data-done="${esc(t("copied"))}" title="${esc(t("copyDiscord"))}">${ICON.discord}<span class="name notranslate">${esc(DISCORD)}</span></button>
			</nav>
		</div>
	</header>

	<div class="hero">
		<h1 class="reveal">${esc(t("title"))}</h1>
		<p class="tagline reveal">${esc(t("tagline"))}</p>
		<div class="facts reveal">
			<div class="fact"><span class="value">${esc(t("years"))}</span><span class="label">${esc(t("yearsLabel"))}</span></div>
			<span class="rule" aria-hidden="true"></span>
			<div class="fact chips"><span class="value">${t("chips").split(" · ").map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</span><span class="label">${esc(t("chipsLabel"))}</span></div>
			<span class="rule" aria-hidden="true"></span>
			<div class="fact"><span class="value ${COMMISSIONS_OPEN ? "open" : "closed"}"><span class="dot"></span>${esc(t(COMMISSIONS_OPEN ? "open" : "closed"))}</span><span class="label">${esc(t("commissions"))}</span></div>
		</div>
		<p class="profile-note reveal">${ICON.info}<span>${esc(t("note"))}</span></p>
	</div>

	<div class="filters" id="work">
		<div class="inner">
			<label class="search">${ICON.search}<input type="search" placeholder="${esc(t("search"))}" aria-label="${esc(t("search"))}" autocomplete="off"></label>
			<div class="pills">
				<span class="glider" aria-hidden="true"></span>
					${pills}
			</div>
		</div>
	</div>

	<main>${body}
		<p class="empty" hidden>${esc(t("empty"))}</p>
	</main>

	<section class="ai" id="ai">
		<div class="ai-card reveal">
			<h2>${esc(t("aiQuestion"))}</h2>
			<p class="lead">${esc(t("aiLead"))}</p>
			<p class="body">${esc(t("aiBody"))}</p>
			<div class="ai-options">${[["withAI", "withAIText"], ["withoutAI", "withoutAIText"]].map(([label, text]) => `
				<div class="option"><span class="option-label">${esc(t(label))}</span><p>${esc(t(text))}</p></div>`).join("")}
			</div>
		</div>
		<div class="ai-card reveal">
			<h2>${esc(t("trialTitle"))}</h2>
			<p class="lead">${esc(t("trialLead"))}</p>
			<p class="body">${esc(t("trialBody"))}</p>
			<div class="ai-options">
				<div class="option"><span class="option-label">${esc(t("trialStep"))}</span><p>${esc(t("trialStepText"))}</p></div>
				<div class="option"><span class="option-label">${esc(t("contact"))}</span><button class="discord" data-copy="${esc(DISCORD)}" data-done="${esc(t("copied"))}" title="${esc(t("copyDiscord"))}">${ICON.discord}<span class="name notranslate">${esc(DISCORD)}</span></button></div>
			</div>
		</div>
	</section>

	<footer>
		<div class="inner">
			<p class="copyright">© ${new Date().getFullYear()} <span class="notranslate">${esc(NAME)}</span> · ${esc(t("rights"))}</p>
		</div>
	</footer>

	<div class="viewer" id="viewer" aria-hidden="true">
		<button class="close" aria-label="${esc(t("close"))}">×</button>
		<button class="step prev" aria-label="${esc(t("prev"))}">${ICON.left}</button>
		<button class="step next" aria-label="${esc(t("next"))}">${ICON.right}</button>
		<div class="viewer-box">
			<video controls loop playsinline muted></video>
			<div class="viewer-head">
				<h3 class="caption"></h3>
				<button class="copy-link" data-done="${esc(t("copied"))}">${ICON.link}<span>${esc(t("copyLink"))}</span></button>
			</div>
			<p class="viewer-desc"></p>
		</div>
	</div>
${lang === "en" ? `
	<div id="google_translate_element" hidden></div>` : ""}
	<script src="${P}script.js"></script>
</body>
</html>
`;
}

fs.writeFileSync(path.join(here, "index.html"), page("en"));
for (const lang of HAND) {
	fs.mkdirSync(path.join(here, lang), { recursive: true });
	fs.writeFileSync(path.join(here, lang, "index.html"), page(lang));
}
console.log(`index.html + ${HAND.map((l) => l + "/").join(" ")}: ${sections.length} categories, ${total} clips`);
