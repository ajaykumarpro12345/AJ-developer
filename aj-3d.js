// Interactive 3D Metallic Chrome & Royal-Blue "A" Emblem (Three.js) for AJ Developers
import * as THREE from "https://esm.sh/three@0.170.0";

function createStudioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x03050d);

  // Studio light panels that create the signature dark-chrome + electric-blue reflections
  const panels = [
    { color: 0x3b82ff, pos: [7, 5, 6], rot: [0, -0.6, 0], size: [7, 10] },
    { color: 0x001aff, pos: [-7, -2, 5], rot: [0, 0.7, 0], size: [8, 9] },
    { color: 0xdbeafe, pos: [2, 8, 5], rot: [0.8, 0, 0], size: [9, 3.2] },
    { color: 0x1d4ed8, pos: [0, -7, 4], rot: [-0.9, 0, 0], size: [10, 4] },
    { color: 0xffffff, pos: [-5, 4, -6], rot: [0, 2.4, 0], size: [3, 9] },
    { color: 0x2563eb, pos: [6, -3, -5], rot: [0, -2.3, 0], size: [5, 8] }
  ];

  panels.forEach((p) => {
    const geo = new THREE.PlaneGeometry(p.size[0], p.size[1]);
    const mat = new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
    envScene.add(mesh);
  });

  const envRT = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return envRT.texture;
}

function buildLetterAGeometry() {
  // Bold modern geometric "A"
  const shape = new THREE.Shape();
  shape.moveTo(-1.38, -1.55);
  shape.lineTo(-0.34, 1.6);
  shape.lineTo(0.34, 1.6);
  shape.lineTo(1.38, -1.55);
  shape.lineTo(0.74, -1.55);
  shape.lineTo(0.49, -0.76);
  shape.lineTo(-0.49, -0.76);
  shape.lineTo(-0.74, -1.55);
  shape.closePath();

  // Inner triangular counter hole
  const hole = new THREE.Path();
  hole.moveTo(-0.31, -0.22);
  hole.lineTo(0.31, -0.22);
  hole.lineTo(0.0, 0.8);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.72,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 12
  });
  geo.center();
  return geo;
}

function buildSunburstGroup(material) {
  const group = new THREE.Group();

  // Central bold 3D "A"
  const letterMesh = new THREE.Mesh(buildLetterAGeometry(), material);
  group.add(letterMesh);

  // Radiating geometric sun-rays around the "A" matching the iconic dark-chrome sunburst look
  const rayAngles = [90, 46, 8, -32, -148, 172, 134];
  const rayGeo = new THREE.ExtrudeGeometry(
    (() => {
      const s = new THREE.Shape();
      const w = 0.24, h = 1.08;
      s.moveTo(-w / 2, 0);
      s.lineTo(w / 2, 0);
      s.lineTo(w / 2, h);
      s.lineTo(-w / 2, h);
      s.closePath();
      return s;
    })(),
    {
      depth: 0.64,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.045,
      bevelSegments: 3
    }
  );
  rayGeo.translate(0, 0, -0.32);

  rayAngles.forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const pivot = new THREE.Group();
    pivot.rotation.z = rad - Math.PI / 2;
    const ray = new THREE.Mesh(rayGeo, material);
    // Distance from center so rays emerge cleanly around the "A" silhouette
    const radius = deg === 90 ? 1.72 : 1.56;
    ray.position.y = radius;
    pivot.add(ray);
    group.add(pivot);
  });

  return group;
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
  scene.environment = createStudioEnv(renderer);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 9.6);

  // Dark chrome material with crisp blue/white specular highlights
  const chromeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x1b243b),
    metalness: 0.96,
    roughness: 0.14,
    envMapIntensity: 1.9
  });

  const emblem = buildSunburstGroup(chromeMat);
  emblem.rotation.set(0.18, -0.38, -0.05);
  scene.add(emblem);

  // Directional key, blue rim, and soft fill lights
  const keyLight = new THREE.DirectionalLight(0x93c5fd, 3.2);
  keyLight.position.set(5, 6, 7);
  scene.add(keyLight);

  const blueRim = new THREE.DirectionalLight(0x0022ff, 4.5);
  blueRim.position.set(-6, -3, 4);
  scene.add(blueRim);

  const whiteEdge = new THREE.PointLight(0xe0f2fe, 12, 22);
  whiteEdge.position.set(3.5, 4.5, 5.5);
  scene.add(whiteEdge);

  const section = host.closest(".spline-section") || document.body;
  let targetMouseX = 0, targetMouseY = 0;
  let mouseX = 0, mouseY = 0;
  let scrollProgress = 0;

  function resize() {
    const w = host.clientWidth || 520;
    const h = host.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 420 ? 11.2 : 9.4;
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

  let rafId = 0;
  let isVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { rootMargin: "200px" }).observe(host);
  }

  const clock = new THREE.Clock();
  function animate() {
    rafId = requestAnimationFrame(animate);
    if (!isVisible) return;

    const t = clock.getElapsedTime();
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;

    // Smooth scroll-linked spin + subtle float + interactive mouse tilt
    const targetRotY = -0.35 + scrollProgress * Math.PI * 1.65 + mouseX * 0.42 + Math.sin(t * 0.55) * 0.14;
    const targetRotX = 0.14 + Math.sin(scrollProgress * Math.PI) * 0.25 + mouseY * 0.28 + Math.cos(t * 0.45) * 0.08;

    emblem.rotation.y += (targetRotY - emblem.rotation.y) * 0.08;
    emblem.rotation.x += (targetRotX - emblem.rotation.x) * 0.08;
    emblem.position.y = Math.sin(t * 1.1) * 0.14;

    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAJ3D);
} else {
  initAJ3D();
}
