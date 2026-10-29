// 3D-Startbereich: Man scrollt durch eine Halle (Fliesenboden, Glasfront, Kronleuchter). Nur Desktop, einmal pro Seite aufgebaut.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Fog, Color, CanvasTexture, RepeatWrapping, SRGBColorSpace,
  PlaneGeometry, BoxGeometry, SphereGeometry, TorusGeometry, MeshStandardMaterial, MeshBasicMaterial, Mesh,
  AmbientLight, HemisphereLight, PointLight, InstancedMesh, Object3D, DoubleSide, Group,
} from "three";

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
scene.fog = new Fog(0x0a2a45, 6, 46);
const camera = new PerspectiveCamera(58, 1, 0.1, 120);

// Fliesenboden wie auf dem Foto: weiße Achtecke, schwarze Quadrate an den Kreuzungen
function fliesen() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d"), s = 512, k = s * 0.29, fuge = 6;
  g.fillStyle = "#14161a"; g.fillRect(0, 0, s, s);
  g.fillStyle = "#f3f1ea"; g.beginPath();
  g.moveTo(k, fuge); g.lineTo(s - k, fuge); g.lineTo(s - fuge, k); g.lineTo(s - fuge, s - k);
  g.lineTo(s - k, s - fuge); g.lineTo(k, s - fuge); g.lineTo(fuge, s - k); g.lineTo(fuge, k); g.closePath(); g.fill();
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  t.repeat.set(6, 90); return t;
}
const L = 90, Z0 = 14;
const boden = new Mesh(new PlaneGeometry(6, L), new MeshStandardMaterial({ map: fliesen(), roughness: 0.28 }));
boden.rotation.x = -Math.PI / 2; boden.position.set(0, 0, Z0 - L / 2); scene.add(boden);

const holz = new MeshStandardMaterial({ color: 0x7a5230, roughness: 0.7 });
const decke = new Mesh(new PlaneGeometry(6, L), holz);
decke.rotation.x = Math.PI / 2; decke.position.set(0, 3.6, Z0 - L / 2); scene.add(decke);

// rechte Wand: Marine mit gelber Linie; linke Seite: Glasfront mit Pfosten
const wand = new Mesh(new PlaneGeometry(L, 3.6), new MeshStandardMaterial({ color: 0x0f3a5f, roughness: 0.8, side: DoubleSide }));
wand.rotation.y = -Math.PI / 2; wand.position.set(3, 1.8, Z0 - L / 2); scene.add(wand);
const linie = new Mesh(new BoxGeometry(0.04, 0.06, L), new MeshBasicMaterial({ color: 0xf6c90e }));
linie.position.set(2.97, 1.1, Z0 - L / 2); scene.add(linie);
const glas = new Mesh(new PlaneGeometry(L, 3.6), new MeshStandardMaterial({ color: 0x9cc4e6, transparent: true, opacity: 0.1, roughness: 0.05, side: DoubleSide }));
glas.rotation.y = Math.PI / 2; glas.position.set(-3, 1.8, Z0 - L / 2); scene.add(glas);
const pfosten = new InstancedMesh(new BoxGeometry(0.16, 3.6, 0.16), new MeshStandardMaterial({ color: 0x1b2430, roughness: 0.5 }), 24);
const balken = new InstancedMesh(new BoxGeometry(6, 0.18, 0.2), holz, 24);
const d = new Object3D();
for (let i = 0; i < 24; i++) {
  const z = Z0 - i * 3.75;
  d.position.set(-3, 1.8, z); d.updateMatrix(); pfosten.setMatrixAt(i, d.matrix);
  d.position.set(0, 3.5, z); d.updateMatrix(); balken.setMatrixAt(i, d.matrix);
}
scene.add(pfosten, balken);

// Tische und Stühle als Instanzen
const tm = new MeshStandardMaterial({ color: 0x3b2417, roughness: 0.55 });
const N = 20;
const platten = new InstancedMesh(new BoxGeometry(1.3, 0.05, 0.85), tm, N);
const fuesse = new InstancedMesh(new BoxGeometry(0.1, 0.72, 0.1), tm, N);
const sitze = new InstancedMesh(new BoxGeometry(0.42, 0.05, 0.42), tm, N * 2);
const lehnen = new InstancedMesh(new BoxGeometry(0.42, 0.45, 0.04), tm, N * 2);
for (let i = 0; i < N; i++) {
  const z = Z0 - 2 - i * 4, x = i % 2 ? 1.5 : 0.9;
  d.rotation.set(0, 0, 0);
  d.position.set(x, 0.74, z); d.updateMatrix(); platten.setMatrixAt(i, d.matrix);
  d.position.set(x, 0.36, z); d.updateMatrix(); fuesse.setMatrixAt(i, d.matrix);
  for (let j = 0; j < 2; j++) {
    const dz = j ? 0.7 : -0.7;
    d.position.set(x, 0.45, z + dz); d.updateMatrix(); sitze.setMatrixAt(i * 2 + j, d.matrix);
    d.position.set(x, 0.7, z + dz + (j ? 0.19 : -0.19)); d.updateMatrix(); lehnen.setMatrixAt(i * 2 + j, d.matrix);
  }
}
scene.add(platten, fuesse, sitze, lehnen);

// Kronleuchter: warme Kugeln mit Ring
const warm = new MeshBasicMaterial({ color: 0xffd9a0 });
const leuchter = new Group();
for (let i = 0; i < 9; i++) {
  const z = Z0 - 1 - i * 9.5, g = new Group();
  g.add(new Mesh(new SphereGeometry(0.2, 12, 10), warm));
  const ring = new Mesh(new TorusGeometry(0.42, 0.025, 6, 20), warm); ring.rotation.x = Math.PI / 2; ring.position.y = -0.15; g.add(ring);
  const kette = new Mesh(new BoxGeometry(0.02, 1.0, 0.02), new MeshBasicMaterial({ color: 0x555555 })); kette.position.y = 0.55; g.add(kette);
  g.position.set(i % 2 ? -0.4 : 0.4, 2.7, z); leuchter.add(g);
}
scene.add(leuchter);

scene.add(new AmbientLight(0xffffff, 0.75), new HemisphereLight(0xcfe3ff, 0x5a4026, 0.7));
const lampe = new PointLight(0xffe2b8, 38, 16, 1.6); scene.add(lampe);

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
  const z = 8 - p * 46;
  camera.position.set(sx * 0.5, 1.7 - p * 0.1 + sy * 0.15, z);
  camera.lookAt(sx * 1.2, 1.45 + sy * 0.3, z - 10);
  lampe.position.set(0, 2.4, z - 1.5);
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
