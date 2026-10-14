// The page's moving parts: the category picker, the grid videos, the Discord buttons and a clip opened big.

// GRID VIDEOS, kept light so scrolling never stutters, even on a slow computer:
//   * they play the small 640 px copies (still 60 fps); the full 1080p one only plays when a clip is opened big
//   * a video starts only once it's mostly on screen AND the scrolling has stopped for a moment (starting a video
//     is the heavy part), and pauses as soon as it's mostly off screen
//   * one that's far away gives its video back (frees the decoder and memory); it reloads when it comes back
const START_AFTER_SCROLL = 140;  // ms without scrolling before videos start
const FAR = 1.5;                 // screens away before a video is unloaded

const videos = [...document.querySelectorAll(".clip video")];
const onScreen = new Set();
let lastScroll = 0;
let startTimer = null;

function startVisible() {
	startTimer = null;
	for (const video of onScreen) {
		if (!video.src) video.src = video.dataset.src;
		if (video.paused) video.play().catch(() => {});
	}
}
function scheduleStart() {
	clearTimeout(startTimer);
	const wait = Math.max(START_AFTER_SCROLL - (performance.now() - lastScroll), 0);
	startTimer = setTimeout(startVisible, wait);
}

const watcher = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		const video = entry.target;
		if (entry.intersectionRatio >= 0.5) {
			onScreen.add(video);
		} else {
			onScreen.delete(video);
			if (!video.paused) video.pause();
		}
	}
	scheduleStart();
}, { threshold: [0, 0.5] });
videos.forEach((v) => watcher.observe(v));

window.addEventListener("scroll", () => {
	lastScroll = performance.now();
	scheduleStart();
}, { passive: true });

// (now and then: unload the far ones)
setInterval(() => {
	const limit = innerHeight * FAR;
	for (const video of videos) {
		if (!video.src || onScreen.has(video)) continue;
		const box = video.getBoundingClientRect();
		if (box.bottom < -limit || box.top > innerHeight + limit) {
			video.pause();
			video.removeAttribute("src");
			video.load();
		}
	}
}, 2000);

// The category picker: All shows every section; a category shows only its own
const pills = document.querySelectorAll(".pill");
const sections = document.querySelectorAll("main section");
pills.forEach((pill) => pill.addEventListener("click", () => {
	pills.forEach((p) => p.classList.toggle("active", p === pill));
	const filter = pill.dataset.filter;
	sections.forEach((s) => { s.hidden = filter !== "all" && s.dataset.category !== filter; });
	const top = document.querySelector(".filters").getBoundingClientRect().top + window.scrollY;
	if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
}));

// The Discord buttons copy the name, and say so for a moment
document.querySelectorAll(".discord").forEach((button) => button.addEventListener("click", async () => {
	const name = button.dataset.copy;
	try { await navigator.clipboard.writeText(name); } catch (e) {}
	const action = button.querySelector(".action") || button.querySelector(".name");
	const before = action.textContent;
	button.classList.add("copied");
	action.textContent = "Copied!";
	clearTimeout(button._reset);
	button._reset = setTimeout(() => { button.classList.remove("copied"); action.textContent = before; }, 1600);
}));

// A clip opened big, in full 1080p (click a clip; Esc, the X or the dark area closes it). The grid stops meanwhile.
const viewer = document.getElementById("viewer");
const big = viewer.querySelector("video");
const caption = viewer.querySelector(".caption");
function openClip(clip) {
	videos.forEach((v) => v.pause());
	big.src = clip.dataset.video;
	caption.textContent = clip.dataset.title;
	viewer.classList.add("open");
	document.body.style.overflow = "hidden";
	big.play().catch(() => {});
}
function closeClip() {
	viewer.classList.remove("open");
	document.body.style.overflow = "";
	big.pause();
	big.removeAttribute("src");
	big.load();
	scheduleStart();
}
document.querySelectorAll(".clip").forEach((clip) => clip.addEventListener("click", () => openClip(clip)));
viewer.addEventListener("click", (e) => { if (e.target === viewer || e.target.classList.contains("close")) closeClip(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewer.classList.contains("open")) closeClip(); });
