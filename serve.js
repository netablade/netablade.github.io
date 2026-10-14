// A small local server to look at the site before it goes online: node serve.js [port]  (only this computer)
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const port = Number(process.argv[2] || 8090);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
	".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
	let file = decodeURIComponent(req.url.split("?")[0]);
	if (file.endsWith("/")) file += "index.html";
	file = path.join(root, path.normalize(file));
	if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
	fs.stat(file, (err, st) => {
		if (err || !st.isFile()) { res.writeHead(404); return res.end("not found"); }
		const type = types[path.extname(file)] || "application/octet-stream";
		const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
		if (range) {
			const start = range[1] ? Number(range[1]) : 0;
			const end = range[2] ? Number(range[2]) : st.size - 1;
			res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
			return fs.createReadStream(file, { start, end }).pipe(res);
		}
		res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes" });
		fs.createReadStream(file).pipe(res);
	});
}).listen(port, "127.0.0.1", () => console.log("site on http://127.0.0.1:" + port));
