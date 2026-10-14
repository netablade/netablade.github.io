// The page's moving parts: the category picker, videos that play only while you can see them, and a clip opened big.

// Videos load and play when they come into view and stop when they leave (so the page stays light)
const videos = document.querySelectorAll(".clip video");
const watcher = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		const video = entry.target;
		if (entry.isIntersecting) {
			if (!video.src) video.src = video.dataset.src;
			video.play().catch(() => {});
		} else if (!video.paused) {
			video.pause();
		}
	}
}, { rootMargin: "200px 0px", threshold: 0.25 });
videos.forEach((v) => watcher.observe(v));

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

// A clip opened big (click a clip; Esc, the X or the dark area closes it)
const viewer = document.getElementById("viewer");
const big = viewer.querySelector("video");
const caption = viewer.querySelector(".caption");
function openClip(clip) {
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
}
document.querySelectorAll(".clip").forEach((clip) => clip.addEventListener("click", () => openClip(clip)));
viewer.addEventListener("click", (e) => { if (e.target === viewer || e.target.classList.contains("close")) closeClip(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewer.classList.contains("open")) closeClip(); });
