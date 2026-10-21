// Keep the PHP preview independent of Node and external CDNs at runtime.
const fs = require("node:fs");
const path = require("node:path");
const source = path.resolve(path.dirname(require.resolve("lenis")), "..");
const output = path.resolve(__dirname, "../app/public/assets/vendor");
fs.mkdirSync(output, { recursive: true });
for (const name of ["lenis.min.js", "lenis.css"])
  fs.copyFileSync(path.join(source, "dist", name), path.join(output, name));
fs.copyFileSync(
  path.join(source, "LICENSE"),
  path.resolve(__dirname, "../app/public/assets/licenses/lenis.txt"),
);
console.log("Vendored Lenis 1.3.27, stylesheet and MIT license.");
