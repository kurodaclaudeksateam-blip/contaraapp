// Arma la carpeta www/ que Capacitor empaqueta dentro de la APK.
// OpenCV y las fuentes van incluidos: la app funciona sin internet desde la instalación.
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "www");
rmSync(out, { recursive: true, force: true });
mkdirSync(resolve(out, "vendor"), { recursive: true });

const cvSrc = resolve(root, "node_modules/@techstark/opencv-js/dist/opencv.js");
if (!existsSync(cvSrc)) throw new Error("Falta OpenCV: ejecuta npm install");
cpSync(cvSrc, resolve(out, "vendor/opencv.js"));
cpSync(resolve(root, "fonts"), resolve(out, "fonts"), { recursive: true });

// La app detecta que corre dentro de la APK (window.Capacitor) y usa vendor/opencv.js local.
const html = readFileSync(resolve(root, "index.html"), "utf8");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const doc = html.startsWith("<!doctype") ? html : "<!doctype html>\n<html lang=\"es\">\n<head>\n" + html.replace("<div id=\"app\">", "</head>\n<body>\n<div id=\"app\">") + "\n</body>\n</html>\n";
writeFileSync(resolve(out, "index.html"), doc.replace("__APP_VERSION__", pkg.version));
console.log("www/ listo — OpenCV incluido (" + Math.round(readFileSync(cvSrc).length / 1048576) + " MB), versión " + pkg.version);
