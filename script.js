// ================================
// Interactive Brain with Clickable Markers
// ================================

let scene, camera, renderer, controls, raycaster, mouse;
let brain;
const markers = [];
const infoCard = document.getElementById("infoCard");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");

function init() {
  const container = document.getElementById("brainCanvas");

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  const point = new THREE.PointLight(0xffffff, 1);
  point.position.set(5, 5, 5);
  scene.add(ambient, point);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Load brain model
  const loader = new THREE.GLTFLoader();
  loader.load(
    "./assets/brain_point_cloud/brain_with_markers.glb",
    (gltf) => {
      console.log("✅ Loaded model:", gltf);
      console.log("Objects:", gltf.scene.children);
      brain = gltf.scene;
      brain.scale.set(5, 5, 5);
      scene.add(brain);
      animate();
    },
    undefined,
    (error) => {
      console.error("❌ Error loading model:", error);
    }
  );
  

  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("pointerdown", onClick);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function addMarkers() {
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff552e,
    emissive: 0xff552e,
    emissiveIntensity: 0.7
  });

  // Each marker has { position, title, text }
  const markerData = [
    { pos: [1.2, 0.5, 1.0], title: "Frontal Lobe", text: "NeuroTech fosters innovation and leadership through student-driven research." },
    { pos: [-1.0, 0.3, 1.2], title: "Temporal Lobe", text: "We explore auditory and sensory integration for neural feedback systems." },
    { pos: [0.0, -0.8, 0.0], title: "Brainstem", text: "Supporting structure — where NeuroTech operations and logistics thrive." },
    { pos: [0.8, 0.6, -1.2], title: "Parietal Lobe", text: "Data integration and spatial computing projects happen here." },
    { pos: [-0.9, 0.7, -1.1], title: "Occipital Lobe", text: "Vision and perception — the foundation for our VR and BCI interfaces." }
  ];

  markerData.forEach((m) => {
    const geom = new THREE.SphereGeometry(0.08, 16, 16);
    const mesh = new THREE.Mesh(geom, markerMaterial);
    mesh.position.set(...m.pos);
    mesh.userData = { title: m.title, text: m.text };
    markers.push(mesh);
    scene.add(mesh);
  });
}

function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(markers);

  if (intersects.length > 0) {
    const marker = intersects[0].object;
    showInfoCard(event.clientX, event.clientY, marker.userData.title, marker.userData.text);
  } else {
    hideInfoCard();
  }
}

function showInfoCard(x, y, title, text) {
  infoTitle.textContent = title;
  infoText.textContent = text;
  infoCard.style.left = `${x}px`;
  infoCard.style.top = `${y - 20}px`;
  infoCard.classList.remove("hidden");
}

function hideInfoCard() {
  infoCard.classList.add("hidden");
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

window.onload = init;
// ================================
// ✨ FLOATY TEXT ON CLICK (after start)
// ================================
const floatLayer = document.getElementById("floaty-layer");
let floatyActive = false; // <- flag to ensure only activates after start

const floatMessages = [
  "🧠 Innovation!",
  "💡 NeuroTech at UIUC!",
  "⚙️ Brain meets code!",
  "🎧 BCI in action!",
  "📊 Data + Mind!",
  "🌐 VR Neurofeedback!",
  "💥 Synaptic Sparks!",
  "🧬 Neuroengineering!"
];

let floatIndex = 0;

// 1️⃣ Wait for user to click “Tap anywhere to begin”
const overlay = document.getElementById("brainOverlay");
const brainFrame = document.getElementById("brainFrame");

overlay.addEventListener("click", () => {
  overlay.classList.add("hidden");
  const iframe = brainFrame;
  const client = new window.Sketchfab(iframe);

  // After model loads, allow floaty text
  setTimeout(() => {
    floatyActive = true;
  }, 1500);

  // Trigger Sketchfab start
  setTimeout(() => {
    iframe.contentWindow.postMessage({ target: 'api.frame', method: 'start' }, '*');
  }, 1000);
});

// 2️⃣ Spawn bubbles only after activation
document.addEventListener("click", (e) => {
  if (!floatyActive) return; // don’t spawn before model starts
  if (e.target.closest(".navbar")) return; // ignore navbar

  const bubble = document.createElement("div");
  bubble.classList.add("floating-text");
  bubble.textContent = floatMessages[floatIndex];
  floatIndex = (floatIndex + 1) % floatMessages.length;

  const offsetX = (Math.random() - 0.5) * 60;
  const offsetY = (Math.random() - 0.5) * 30;
  bubble.style.left = `${e.clientX + offsetX}px`;
  bubble.style.top = `${e.clientY + offsetY}px`;

  floatLayer.appendChild(bubble);
  setTimeout(() => bubble.remove(), 2200);
});
