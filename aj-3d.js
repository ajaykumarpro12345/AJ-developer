// High-visibility 3D Silver & Electric-Blue "AJ" Monogram (Three.js) for AJ Developers
import * as THREE from "https://esm.sh/three@0.170.0";

function createStudioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x162447);

  // Large bright studio softboxes so metallic surfaces always stay crisp and luminous
  const panels = [
    { color: 0xffffff, pos: [0, 8, 8], rot: [0.6, 0, 0], size: [18, 10] },
    { color: 0x60a5fa, pos: [10, 3, 6], rot: [0, -0.9, 0], size: [14, 14] },
    { color: 0x3b82f6, pos: [-10, -2, 6], rot: [0, 0.9, 0], size: [14, 14] },
    { color: 0xe0f2fe, pos: [0, -8, 6], rot: [-0.8, 0, 0], size: [16, 8] },
    { color: 0x93c5fd, pos: [0, 2, -10], rot: [0, Math.PI, 0], size: [18, 14] }
  ];

  panels.forEach((p) => {
    const geo = new THREE.PlaneGeometry(p.size[0], p.size[1]);
    const mat = new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
    envScene.add(mesh);
  });

  const envRT = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return envRT.texture;
}

const EXTRUDE_OPTS = {
  depth: 0.72,
  bevelEnabled: true,
  bevelThickness: 0.09,
  bevelSize: 0.065,
  bevelSegments: 5,
  curveSegments: 24
};

function buildLetterA() {
  const s = new THREE.Shape();
  s.moveTo(-1.28, -1.5);
  s.lineTo(-0.3, 1.5);
  s.lineTo(0.3, 1.5);
  s.lineTo(1.28, -1.5);
  s.lineTo(0.68, -1.5);
  s.lineTo(0.45, -0.76);
  s.lineTo(-0.45, -0.76);
  s.lineTo(-0.68, -1.5);
  s.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-0.28, -0.24);
  hole.lineTo(0.28, -0.24);
  hole.lineTo(0.0, 0.74);
  hole.closePath();
  s.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(s, EXTRUDE_OPTS);
  geo.translate(0, 0, -EXTRUDE_OPTS.depth / 2);
  return geo;
}

function buildLetterJ() {
  // Clean geometric "J" matching the height (-1.5 to +1.5) and stroke weight (~0.56) of "A"
  const s = new THREE.Shape();
  s.moveTo(0.26, 1.5);
  s.lineTo(0.84, 1.5);
  s.lineTo(0.84, -0.48);
  // Outer bottom curve
  s.bezierCurveTo(0.84, -1.24, 0.36, -1.56, -0.28, -1.56);
  s.bezierCurveTo(-0.88, -1.56, -1.28, -1.16, -1.28, -0.58);
  s.lineTo(-0.7, -0.58);
  // Inner bottom curve
  s.bezierCurveTo(-0.7, -0.88, -0.52, -1.04, -0.24, -1.04);
  s.bezierCurveTo(0.08, -1.04, 0.26, -0.84, 0.26, -0.46);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, EXTRUDE_OPTS);
  geo.translate(0, 0, -EXTRUDE_OPTS.depth / 2);
  return geo;
}

function initAJ3D() {
  const host = document.getElementById("aj-3d-stage");
  if (!host) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  host.innerHTML = "";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = createStudioEnv(renderer);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 8.6);

  // Bright platinum-silver front face + vibrant glowing electric-blue 3D extruded sides
  const frontMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xeef4ff),
    emissive: new THREE.Color(0x1d3b8a),
    emissiveIntensity: 0.32,
    metalness: 0.55,
    roughness: 0.16,
    envMapIntensity: 1.5
  });

  const sideMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x2563ff),
    emissive: new THREE.Color(0x0b2eff),
    emissiveIntensity: 0.55,
    metalness: 0.45,
    roughness: 0.2,
    envMapIntensity: 1.4
  });

  const materials = [frontMat, sideMat];

  const emblem = new THREE.Group();

  const meshA = new THREE.Mesh(buildLetterA(), materials);
  meshA.position.x = -1.25;
  emblem.add(meshA);

  const meshJ = new THREE.Mesh(buildLetterJ(), materials);
  meshJ.position.x = 1.38;
  emblem.add(meshJ);

  // Subtle glowing orbital accent ring behind "AJ"
  const ringGeo = new THREE.TorusGeometry(2.85, 0.032, 16, 96);
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x60a5fa),
    emissive: new THREE.Color(0x2563ff),
    emissiveIntensity: 0.9,
    metalness: 0.7,
    roughness: 0.15
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.set(1.15, 0.35, 0.2);
  emblem.add(ring);

  emblem.rotation.set(0.12, -0.26, 0);
  scene.add(emblem);

  // Strong, balanced studio lighting so "AJ" is unmistakably clear from every angle
  scene.add(new THREE.AmbientLight(0xdbeafe, 1.4));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1e3a8a, 1.5));

  const frontKey = new THREE.DirectionalLight(0xffffff, 2.8);
  frontKey.position.set(4, 5, 8);
  scene.add(frontKey);

  const blueFill = new THREE.DirectionalLight(0x3b82ff, 2.4);
  blueFill.position.set(-6, -3, 6);
  scene.add(blueFill);

  const rimLight = new THREE.PointLight(0x93c5fd, 14, 24);
  rimLight.position.set(0, 4, 6);
  scene.add(rimLight);

  const section = host.closest(".spline-section") || document.body;
  let targetMouseX = 0, targetMouseY = 0;
  let mouseX = 0, mouseY = 0;
  let scrollProgress = 0;

  function resize() {
    const w = host.clientWidth || 520;
    const h = host.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 440 ? 11.4 : 9.2;
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

    // Gentle, readable 3D sway + scroll tilt (keeps "AJ" facing forward & readable!)
    const targetRotY = -0.22 + Math.sin(scrollProgress * Math.PI * 1.5) * 0.48 + mouseX * 0.36 + Math.sin(t * 0.65) * 0.16;
    const targetRotX = 0.08 + Math.cos(scrollProgress * Math.PI) * 0.14 + mouseY * 0.22 + Math.cos(t * 0.5) * 0.06;

    emblem.rotation.y += (targetRotY - emblem.rotation.y) * 0.08;
    emblem.rotation.x += (targetRotX - emblem.rotation.x) * 0.08;
    emblem.position.y = Math.sin(t * 1.15) * 0.14;
    ring.rotation.z = t * 0.35;

    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAJ3D);
} else {
  initAJ3D();
}
