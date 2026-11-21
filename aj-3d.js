// Liquid Chrome (Obsidian + Cool Silver-Gray + Cobalt Blue) 3D "AJ" Emblem matching the original source design
import * as THREE from "https://esm.sh/three@0.170.0";

function createChromeEnvMap(renderer) {
  // High-contrast equirectangular studio reflection map:
  // produces the signature glossy black + cool metallic gray + vivid cobalt-blue split reflections
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base deep dark obsidian-slate studio
  ctx.fillStyle = "#04060c";
  ctx.fillRect(0, 0, 1024, 512);

  // Broad cool silver-gray front studio panel (makes front faces crisp rich metallic gray)
  const frontGrad = ctx.createLinearGradient(280, 40, 740, 470);
  frontGrad.addColorStop(0, "#d4dde8");
  frontGrad.addColorStop(0.45, "#94a3b8");
  frontGrad.addColorStop(0.75, "#475569");
  frontGrad.addColorStop(1, "#0b1120");
  ctx.fillStyle = frontGrad;
  ctx.fillRect(300, 30, 380, 440);

  // Vivid cobalt/sky-blue chrome reflection band (signature blue sheen on right & angled facets)
  const blueGrad = ctx.createLinearGradient(620, 0, 960, 460);
  blueGrad.addColorStop(0, "#60a5fa");
  blueGrad.addColorStop(0.4, "#2575fc");
  blueGrad.addColorStop(0.8, "#0038ff");
  blueGrad.addColorStop(1, "#020617");
  ctx.fillStyle = blueGrad;
  ctx.fillRect(650, 20, 290, 420);

  // Crisp bright silver-blue rim strip on the left edge so left bevels catch sharp highlights
  const leftRim = ctx.createLinearGradient(40, 60, 210, 420);
  leftRim.addColorStop(0, "#05070e");
  leftRim.addColorStop(0.45, "#1e293b");
  leftRim.addColorStop(0.65, "#93c5fd");
  leftRim.addColorStop(0.8, "#3b82f6");
  leftRim.addColorStop(1, "#05070e");
  ctx.fillStyle = leftRim;
  ctx.fillRect(40, 60, 170, 360);

  // Top crisp white-silver specular streak
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(220, 18, 520, 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return envRT.texture;
}

const EXTRUDE_OPTS = {
  depth: 0.88,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.025,
  bevelSegments: 3,
  curveSegments: 24
};

function buildLetterA() {
  const s = new THREE.Shape();
  s.moveTo(-1.26, -1.42);
  s.lineTo(-0.3, 1.42);
  s.lineTo(0.3, 1.42);
  s.lineTo(1.26, -1.42);
  s.lineTo(0.66, -1.42);
  s.lineTo(0.44, -0.72);
  s.lineTo(-0.44, -0.72);
  s.lineTo(-0.66, -1.42);
  s.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-0.27, -0.22);
  hole.lineTo(0.27, -0.22);
  hole.lineTo(0.0, 0.7);
  hole.closePath();
  s.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(s, EXTRUDE_OPTS);
  geo.translate(0, 0, -EXTRUDE_OPTS.depth / 2);
  return geo;
}

function buildLetterJ() {
  const s = new THREE.Shape();
  s.moveTo(0.24, 1.42);
  s.lineTo(0.82, 1.42);
  s.lineTo(0.82, -0.44);
  s.bezierCurveTo(0.82, -1.16, 0.36, -1.48, -0.26, -1.48);
  s.bezierCurveTo(-0.84, -1.48, -1.22, -1.1, -1.22, -0.54);
  s.lineTo(-0.66, -0.54);
  s.bezierCurveTo(-0.66, -0.82, -0.5, -0.98, -0.22, -0.98);
  s.bezierCurveTo(0.08, -0.98, 0.24, -0.78, 0.24, -0.42);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, EXTRUDE_OPTS);
  geo.translate(0, 0, -EXTRUDE_OPTS.depth / 2);
  return geo;
}

function buildSunburstRays(material) {
  const raysGroup = new THREE.Group();
  const rayShape = new THREE.Shape();
  const w = 0.34, h = 1.15;
  rayShape.moveTo(-w / 2, 0);
  rayShape.lineTo(w / 2, 0);
  rayShape.lineTo(w / 2, h);
  rayShape.lineTo(-w / 2, h);
  rayShape.closePath();

  const rayGeo = new THREE.ExtrudeGeometry(rayShape, {
    depth: 0.78,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 2
  });
  rayGeo.translate(0, 0, -0.39);

  // 8 sharp radiating rays around the "AJ" core, matching the original sunburst silhouette
  const angles = [90, 48, 8, -32, -90, -148, 172, 132];
  angles.forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const pivot = new THREE.Group();
    pivot.rotation.z = rad - Math.PI / 2;
    const mesh = new THREE.Mesh(rayGeo, material);
    // Elliptical radius so rays frame the wider "AJ" cleanly without touching the letters
    const rx = 2.68, ry = 2.02;
    const dist = Math.hypot(Math.cos(rad) * rx, Math.sin(rad) * ry);
    mesh.position.y = dist;
    pivot.add(mesh);
    raysGroup.add(pivot);
  });

  return raysGroup;
}

function initAJ3D() {
  const host = document.getElementById("aj-3d-stage");
  if (!host) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.innerHTML = "";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = createChromeEnvMap(renderer);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 12.2);

  // True liquid-chrome metallic material (albedo high so envMap drives the black / silver-gray / blue reflections)
  const chromeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xdbe3ee),
    metalness: 0.96,
    roughness: 0.08,
    envMapIntensity: 1.55
  });

  const emblem = new THREE.Group();

  const meshA = new THREE.Mesh(buildLetterA(), chromeMat);
  meshA.position.x = -1.18;
  emblem.add(meshA);

  const meshJ = new THREE.Mesh(buildLetterJ(), chromeMat);
  meshJ.position.x = 1.28;
  emblem.add(meshJ);

  emblem.add(buildSunburstRays(chromeMat));

  emblem.rotation.set(0.14, -0.34, -0.04);
  scene.add(emblem);

  // Subtle rim lights to accentuate sharp bevel edges
  const keyLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
  keyLight.position.set(4, 6, 8);
  scene.add(keyLight);

  const blueAccent = new THREE.DirectionalLight(0x2575fc, 3.2);
  blueAccent.position.set(7, 2, 5);
  scene.add(blueAccent);

  const section = host.closest(".spline-section") || document.body;
  let targetMouseX = 0, targetMouseY = 0;
  let mouseX = 0, mouseY = 0;
  let scrollProgress = 0;

  function resize() {
    const w = host.clientWidth || 520;
    const h = host.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 440 ? 15.2 : 12.2;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function updateScroll() {
    const rect = section.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight);
    scrollProgress = Math.max(0, Math.min(1, -rect.top / total));
  }
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  let isVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { rootMargin: "200px" }).observe(host);
  }

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const t = clock.getElapsedTime();
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;

    // Smooth scroll-linked 3D rotation + interactive tilt matching the original Spline motion
    const targetRotY = -0.32 + Math.sin(scrollProgress * Math.PI * 1.4) * 0.55 + mouseX * 0.4 + Math.sin(t * 0.55) * 0.14;
    const targetRotX = 0.12 + Math.cos(scrollProgress * Math.PI) * 0.16 + mouseY * 0.24 + Math.cos(t * 0.45) * 0.07;

    emblem.rotation.y += (targetRotY - emblem.rotation.y) * 0.08;
    emblem.rotation.x += (targetRotX - emblem.rotation.x) * 0.08;
    emblem.position.y = Math.sin(t * 1.05) * 0.14;

    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAJ3D);
} else {
  initAJ3D();
}
