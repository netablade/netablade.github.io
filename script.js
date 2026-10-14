// The page's moving parts: light/dark, the language picker, search + categories (with animated changes), the grid
// videos, the Discord buttons and a clip opened big.
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const store = {
	get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
	set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};

// ---------------------------------------------------------------- LIGHT / DARK (dark unless the visitor picks light)
$(".theme-button").addEventListener("click", () => {
	const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	$('meta[name="theme-color"]').content = next === "dark" ? "#000000" : "#ffffff";
	store.set("theme", next);
	moveGlider();
});

// ---------------------------------------------------------------- LANGUAGE
// Turkish, Spanish and Portuguese are translated by hand and have their own page (tr/, es/, pt/); every other language
// is the English page run through Google Translate (only loaded when one of those is picked).
const lang = $(".lang");
const pageLang = document.documentElement.lang;
const root = document.documentElement.dataset.root || "";
const googleLang = (document.cookie.match(/googtrans=\/en\/([^;]+)/) || [])[1];
const currentLang = pageLang !== "en" ? pageLang : googleLang || "en";
$(".lang-code").textContent = currentLang.split("-")[0].toUpperCase();
$$(".lang-menu button").forEach((b) => b.classList.toggle("current", b.dataset.lang === currentLang));
$(".lang-button").addEventListener("click", (e) => { e.stopPropagation(); lang.classList.toggle("open"); });
document.addEventListener("click", (e) => { if (!lang.contains(e.target)) lang.classList.remove("open"); });
$$(".lang-menu button").forEach((b) => b.addEventListener("click", () => {
	const code = b.dataset.lang;
	if (code === currentLang) { lang.classList.remove("open"); return; }
	const expire = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
	document.cookie = "googtrans=; path=/" + expire;
	document.cookie = "googtrans=; path=/; domain=" + location.hostname + expire;
	if (code !== "en" && !b.dataset.page) document.cookie = "googtrans=/en/" + code + "; path=/";
	store.set("lang", code);
	// (the same clip stays open in the new language)
	const target = new URL(root + (b.dataset.page || "") || "./", location.href);
	target.hash = location.hash;
	if (target.pathname === location.pathname) location.reload();
	else location.href = target.href;
}));
if (pageLang === "en" && currentLang !== "en") {
	window.googleTranslateInit = () => new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
	const s = document.createElement("script");
	s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateInit";
	document.body.appendChild(s);
}

// ---------------------------------------------------------------- RISING IN AS THEY COME INTO VIEW
const revealer = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		if (entry.isIntersecting) {
			entry.target.classList.add("shown");
			revealer.unobserve(entry.target);
		}
	}
}, { rootMargin: "0px 0px -40px 0px" });
$$(".reveal, main .clip").forEach((el) => revealer.observe(el));

// ---------------------------------------------------------------- VIDEOS, kept light so scrolling never stutters
//   * only each category's BIG video plays; the small ones show their first frame (nothing to decode)
//   * it plays the small 640 px copy (still 60 fps); the full 1080p one only plays when a clip is opened
//   * it starts once it's mostly on screen AND the scrolling has stopped for a moment (starting a video is the
//     heavy part), pauses when it's mostly off screen, and gives its video back when it's far away
const START_AFTER_SCROLL = 140; // ms without scrolling before a video starts
const FAR = 1.5;                // screens away before a video is unloaded
const main = $("main");
const videos = $$(".clip video");
const onScreen = new Set();
let lastScroll = 0;
let startTimer = null;
let viewerOpen = false;

function playable(video) {
	const clip = video.closest(".clip");
	return clip.classList.contains("big") && !main.classList.contains("searching") && !clip.hidden && !clip.closest("section").hidden;
}
function unload(video) {
	video.pause();
	if (video.src) {
		video.removeAttribute("src");
		video.load(); // (back to its first frame, nothing kept in memory)
	}
}
function startVisible() {
	startTimer = null;
	if (viewerOpen) return;
	for (const video of onScreen) {
		if (!playable(video)) continue;
		if (!video.src) video.src = video.dataset.src;
		if (video.paused) video.play().catch(() => {});
	}
}
function scheduleStart() {
	clearTimeout(startTimer);
	startTimer = setTimeout(startVisible, Math.max(START_AFTER_SCROLL - (performance.now() - lastScroll), 0));
}
const watcher = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		if (entry.intersectionRatio >= 0.5) {
			onScreen.add(entry.target);
		} else {
			onScreen.delete(entry.target);
			if (!entry.target.paused) entry.target.pause();
		}
	}
	scheduleStart();
}, { threshold: [0, 0.5] });
videos.forEach((v) => watcher.observe(v));
window.addEventListener("scroll", () => { lastScroll = performance.now(); scheduleStart(); }, { passive: true });
setInterval(() => {
	const limit = innerHeight * FAR;
	for (const video of videos) {
		if (!video.src || onScreen.has(video)) continue;
		const box = video.getBoundingClientRect();
		if (box.bottom < -limit || box.top > innerHeight + limit) unload(video);
	}
}, 2000);

// ---------------------------------------------------------------- THE LAYOUT OF A CATEGORY (no row left half empty)
// The big one takes the left 4 of 6 columns over two rows, the next two stand on its right. The rest go in rows of
// three; if that leaves one or two over, the last rows hold two each (wider), or a single one sits in the middle.
// (Phones: two across; a last one left alone sits in the middle.)
function layout(feature) {
	const cards = [...feature.children].filter((c) => !c.hidden && getComputedStyle(c).display !== "none");
	for (const c of feature.children) c.classList.remove("side1", "side2", "w3", "w-center", "m-center");
	cards.forEach((c, i) => {
		c.classList.toggle("big", i === 0);
		c.classList.toggle("small", i !== 0);
	});
	if (cards[1]) cards[1].classList.add("side1");
	if (cards[2]) cards[2].classList.add("side2");
	const rest = cards.slice(3);
	const r = rest.length % 3;
	if (r === 2) {
		rest.slice(-2).forEach((c) => c.classList.add("w3"));
	} else if (r === 1 && rest.length === 1) {
		rest[0].classList.add("w-center");
	} else if (r === 1) {
		rest.slice(-4).forEach((c) => c.classList.add("w3"));
	}
	// (phones: everything after the big one in pairs)
	if ((cards.length - 1) % 2 === 1) cards[cards.length - 1].classList.add("m-center");
}
function layoutAll() {
	if (main.classList.contains("searching")) return;
	$$(".feature").forEach(layout);
}

// ---------------------------------------------------------------- BIG AND SMALL: a small one clicked swaps places with the big one
// (both pictures glide and resize to each other's place; only transform is animated, so it costs nothing)
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
function glide(el, from) {
	const to = el.getBoundingClientRect();
	el.style.transition = "none";
	el.style.transformOrigin = "0 0";
	el.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})`;
	requestAnimationFrame(() => requestAnimationFrame(() => {
		el.style.transition = `transform 0.55s ${EASE}`;
		el.style.transform = "";
		setTimeout(() => { el.style.transition = ""; el.style.transformOrigin = ""; }, 560);
	}));
}
function swap(small) {
	const feature = small.parentElement;
	const big = $(".clip.big", feature);
	if (!big || big === small) return;
	const bigFrame = $(".frame", big), smallFrame = $(".frame", small);
	const bigWas = bigFrame.getBoundingClientRect(), smallWas = smallFrame.getBoundingClientRect();
	unload($("video", big));
	// (the small one goes first in the list, the big one takes its old place)
	const marker = document.createComment("");
	feature.replaceChild(marker, small);
	feature.insertBefore(small, feature.firstChild);
	feature.replaceChild(big, marker);
	layout(feature);
	glide(smallFrame, smallWas);
	glide(bigFrame, bigWas);
	for (const clip of [big, small]) {
		$(".text", clip).animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
			{ duration: 380, delay: 160, easing: EASE, fill: "backwards" });
	}
	scheduleStart();
}

// ---------------------------------------------------------------- SEARCH + CATEGORIES
const pills = $$(".pill");
const glider = $(".glider");
const sections = $$("main section");
const clips = $$("main .clip");
const search = $(".search input");
const empty = $(".empty");
let filter = "all";
// (the same folding build.js gives each clip's words: lower case, no accents)
const fold = (s) => s.toLocaleLowerCase(pageLang).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");

// the highlight slides under the picked category
function moveGlider() {
	const active = $(".pill.active");
	if (!active) return;
	glider.style.width = active.offsetWidth + "px";
	glider.style.transform = `translateX(${active.offsetLeft}px)`;
}
moveGlider();
window.addEventListener("resize", moveGlider);
if (document.fonts) document.fonts.ready.then(moveGlider);

// when the categories don't all fit, the row scrolls and fades on the side that has more
const pillRow = $(".pills");
function pillEdges() {
	const end = pillRow.scrollWidth - pillRow.clientWidth;
	pillRow.classList.toggle("more-left", pillRow.scrollLeft > 2);
	pillRow.classList.toggle("more-right", pillRow.scrollLeft < end - 2);
}
pillEdges();
pillRow.addEventListener("scroll", pillEdges, { passive: true });
window.addEventListener("resize", pillEdges);
if (document.fonts) document.fonts.ready.then(pillEdges);

// what shows: the picked category (all of its clips) or every category (the big one and two small ones each,
// "See all" for the rest); while searching, every match as a plain card
function apply() {
	const words = fold(search.value).trim().split(/\s+/).filter(Boolean);
	const searching = words.length > 0;
	main.classList.toggle("searching", searching);
	let shown = 0;
	for (const s of sections) {
		const inCategory = filter === "all" || s.dataset.category === filter;
		let any = false;
		for (const c of $$(".clip", s)) {
			const show = inCategory && words.every((w) => c.dataset.search.includes(w));
			c.hidden = !show;
			if (show) { any = true; shown++; }
		}
		s.hidden = !any;
		const feature = $(".feature", s);
		if (filter !== "all") feature.classList.remove("collapsed");
		else if (!s.dataset.open) feature.classList.add("collapsed");
		const more = $(".more", s);
		if (more) more.hidden = filter !== "all";
	}
	empty.hidden = shown > 0;
	if (searching) $$(".feature .clip").forEach((c) => c.classList.remove("side1", "side2", "w3", "w-center", "m-center"));
	else layoutAll();
}

// a change fades the list out, swaps it and fades it back in, the cards rising in one after another
let fadeTimer = null;
function change(then) {
	clearTimeout(fadeTimer);
	main.classList.add("fading");
	fadeTimer = setTimeout(() => {
		apply();
		if (then) then();
		let i = 0;
		for (const c of clips) {
			if (c.hidden || c.offsetParent === null) continue;
			c.classList.add("shown");
			c.style.animationDelay = Math.min(i++, 8) * 35 + "ms";
			c.classList.remove("entering");
			void c.offsetWidth;
			c.classList.add("entering");
		}
		main.classList.remove("fading");
		scheduleStart();
	}, 180);
}

pills.forEach((pill) => pill.addEventListener("click", () => {
	if (pill.classList.contains("active")) return;
	pills.forEach((p) => p.classList.toggle("active", p === pill));
	moveGlider();
	pill.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
	filter = pill.dataset.filter;
	change(() => {
		const top = $(".filters").getBoundingClientRect().top + window.scrollY;
		if (window.scrollY > top) window.scrollTo({ top, behavior: "instant" });
	});
}));

let searchTimer = null;
search.addEventListener("input", () => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => change(), 160);
});

// "See all": the rest of that category opens up (and closes again)
$$(".more").forEach((button) => button.addEventListener("click", () => {
	const section = button.closest("section");
	const feature = $(".feature", section);
	const opening = feature.classList.contains("collapsed");
	feature.classList.toggle("collapsed", !opening);
	section.dataset.open = opening ? "1" : "";
	button.textContent = opening ? button.dataset.less : button.dataset.more;
	layout(feature);
	if (opening) {
		$$(".clip", feature).slice(3).forEach((c, i) => {
			c.classList.add("shown");
			c.style.animationDelay = Math.min(i, 8) * 35 + "ms";
			c.classList.remove("entering");
			void c.offsetWidth;
			c.classList.add("entering");
		});
	} else if (section.getBoundingClientRect().top < 0) {
		section.scrollIntoView({ behavior: "smooth" });
	}
}));

// ---------------------------------------------------------------- DISCORD: a click copies the name, and says so
$$("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
	try { await navigator.clipboard.writeText(button.dataset.copy); } catch (e) {}
	const label = $(".name", button);
	const before = label.textContent;
	button.classList.add("copied");
	label.textContent = button.dataset.done;
	clearTimeout(button._reset);
	button._reset = setTimeout(() => { button.classList.remove("copied"); label.textContent = before; }, 1600);
}));

// ---------------------------------------------------------------- A CLIP OPENED BIG (full 1080p; the page's videos stop meanwhile)
// Every clip has its own link (#lock-on-targeting): opening one puts it in the address bar, and a link like that
// opens the clip straight away. ← / → (or the side buttons) go to the previous / next clip that's showing.
const viewer = $("#viewer");
const viewerBox = $(".viewer-box", viewer);
const big = $("video", viewer);
const copyButton = $(".copy-link", viewer);
let current = null;

// the clips you can step through: the ones the categories and the search leave showing, in page order
function showingClips() {
	return clips.filter((c) => !c.hidden && !c.closest("section").hidden);
}
function fill(clip) {
	current = clip;
	big.src = clip.dataset.video;
	$(".caption", viewer).textContent = $(".title", clip).textContent;
	$(".viewer-desc", viewer).textContent = $(".desc", clip).textContent;
	history.replaceState(null, "", "#" + clip.id);
	big.play().catch(() => {});
}
function openClip(clip) {
	viewerOpen = true;
	videos.forEach((v) => v.pause());
	fill(clip);
	viewer.classList.add("open");
	viewer.setAttribute("aria-hidden", "false");
	document.body.style.overflow = "hidden";
}
function closeClip() {
	viewerOpen = false;
	current = null;
	viewer.classList.remove("open");
	viewer.setAttribute("aria-hidden", "true");
	document.body.style.overflow = "";
	big.pause();
	history.replaceState(null, "", location.pathname + location.search);
	setTimeout(() => { if (!viewerOpen) { big.removeAttribute("src"); big.load(); } }, 260);
	scheduleStart();
}
// the next / previous clip, with a quick fade between them
function step(direction) {
	const list = showingClips();
	if (!current || list.length < 2) return;
	const next = list[(list.indexOf(current) + direction + list.length) % list.length];
	viewerBox.classList.add("switching");
	setTimeout(() => {
		fill(next);
		viewerBox.classList.remove("switching");
	}, 150);
}
$(".prev", viewer).addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
$(".next", viewer).addEventListener("click", (e) => { e.stopPropagation(); step(1); });

// copy this clip's link
copyButton.addEventListener("click", async (e) => {
	e.stopPropagation();
	if (!current) return;
	try { await navigator.clipboard.writeText(location.origin + location.pathname + "#" + current.id); } catch (err) {}
	const label = $("span", copyButton);
	const before = label.textContent;
	copyButton.classList.add("copied");
	label.textContent = copyButton.dataset.done;
	clearTimeout(copyButton._reset);
	copyButton._reset = setTimeout(() => { copyButton.classList.remove("copied"); label.textContent = before; }, 1600);
});

// (the big one opens; a small one swaps in first; while searching, any card opens)
clips.forEach((clip) => clip.addEventListener("click", () => {
	if (clip.classList.contains("big") || main.classList.contains("searching")) openClip(clip);
	else swap(clip);
}));
viewer.addEventListener("click", (e) => { if (e.target === viewer || e.target.classList.contains("close")) closeClip(); });
document.addEventListener("keydown", (e) => {
	if (!viewerOpen) return;
	if (e.key === "Escape") closeClip();
	else if (e.key === "ArrowRight") step(1);
	else if (e.key === "ArrowLeft") step(-1);
});

// a link to one clip opens it
function openFromLink() {
	const id = decodeURIComponent(location.hash.slice(1));
	const clip = id && document.getElementById(id);
	if (clip && clip.classList.contains("clip") && clip !== current) openClip(clip);
}
window.addEventListener("hashchange", openFromLink);

layoutAll();
openFromLink();
