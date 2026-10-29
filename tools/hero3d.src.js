// 3D-Startbereich: Das Originalfoto liegt als leicht gewölbte Fläche im Raum, beim Scrollen fährt die Kamera hinein. Nur Desktop.
import { WebGLRenderer, Scene, PerspectiveCamera, TextureLoader, SRGBColorSpace, PlaneGeometry, MeshBasicMaterial, Mesh, Color } from "three";

const pin = document.querySelector(".hero-pin");
const hero = pin?.querySelector(".hero");
const stage = pin?.querySelector(".hero__3d");
if (!pin || !hero || !stage) throw new Error("kein Startbereich");

const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = SRGBColorSpace;
stage.appendChild(renderer.domElement);
renderer.domElement.setAttribute("aria-hidden", "true");

const scene = new Scene();
scene.background = new Color(0x0a2a45);
const camera = new PerspectiveCamera(40, 1, 0.1, 60);

// Foto als Fläche; obere und linke Teile liegen weiter hinten. Die Punkte werden so skaliert, dass die Startansicht dem flachen Foto gleicht.
const D0 = 7.9, B = 11, tiefe = (u, v) => -(1.6 * v + 0.9 * (1 - u) * v);
const geo = new PlaneGeometry(B, B, 110, 110), pos = geo.attributes.position, uv = geo.attributes.uv;
for (let k = 0; k < pos.count; k++) {
  const z = tiefe(uv.getX(k), uv.getY(k)), f = (D0 - z) / D0;
  pos.setXYZ(k, pos.getX(k) * f, pos.getY(k) * f, z);
}
const tex = new TextureLoader().load(stage.dataset.bild, () => { dirty = true; start(); });
tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8;
const foto = new Mesh(geo, new MeshBasicMaterial({ map: tex }));
foto.position.y = 0.57; scene.add(foto);

function groesse() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
}
let dirty = true, aktuell = 0, ziel = 0, mx = 0, my = 0, sx = 0, sy = 0, laeuft = false;
const klemm = (v) => Math.min(1, Math.max(0, v));
const glatt = (t) => t * t * (3 - 2 * t);
const text = hero.querySelector(".hero__copy"), putz = hero.querySelector(".hero__putz");

function messen() {
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 76;
  const r = pin.getBoundingClientRect();
  ziel = klemm((navH - r.top) / (r.height - hero.offsetHeight));
}
function zeichnen() {
  aktuell += (ziel - aktuell) * 0.14; sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
  const p = glatt(aktuell);
  const z = D0 - p * 3.4;
  camera.position.set(sx * 0.55 - p * 0.5, sy * 0.3 + p * 0.25, z);
  camera.lookAt(sx * 0.2 - p * 0.9, sy * 0.1 + p * 0.3, -1.5);
  renderer.render(scene, camera);
  const t = klemm(aktuell / 0.3);
  text.style.opacity = String(1 - t); text.style.transform = `translate3d(0, ${-t * 40}px, 0)`;
  if (putz) putz.style.opacity = String(1 - t);
  dirty = false;
  const ruhig = Math.abs(ziel - aktuell) < 0.0004 && Math.abs(mx - sx) < 0.002 && Math.abs(my - sy) < 0.002;
  if (ruhig) laeuft = false; else requestAnimationFrame(zeichnen);
}
function start() { messen(); if (!laeuft) { laeuft = true; requestAnimationFrame(zeichnen); } }

addEventListener("scroll", start, { passive: true });
addEventListener("pointermove", (e) => { mx = (e.clientX / innerWidth - 0.5) * 2; my = -(e.clientY / innerHeight - 0.5) * 2; start(); }, { passive: true });
new ResizeObserver(() => { groesse(); start(); }).observe(stage);

// Erst Layout umstellen, wenn das erste Bild fertig ist; sonst bleibt das Foto stehen
document.documentElement.classList.add("has-3d");
groesse(); messen(); aktuell = ziel;
zeichnen();
requestAnimationFrame(() => stage.classList.add("is-live"));
