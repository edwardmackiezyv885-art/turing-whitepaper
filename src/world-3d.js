import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const ASSET_URL = "./assets/world/turing-sky-islands.spz";

const shell = document.querySelector(".world-shell");
const canvasHost = document.querySelector("#canvas-host");
const enterButton = document.querySelector("#enter-button");
const panoramaButton = document.querySelector("#panorama-button");
const loadingPanel = document.querySelector("#loading-panel");
const loadingDetail = document.querySelector("#loading-detail");
const progressBar = document.querySelector("#progress-bar");
const progressLabel = document.querySelector("#progress-label");
const cancelButton = document.querySelector("#cancel-button");
const controlPanel = document.querySelector("#control-panel");
const resetButton = document.querySelector("#reset-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const languageButton = document.querySelector("#language-button");
const fallbackPanel = document.querySelector("#fallback-panel");
const fallbackMessage = document.querySelector("#fallback-message");
const diagnosticDetails = document.querySelector("#diagnostic-details");
const diagnosticCode = document.querySelector("#diagnostic-code");
const retryButton = document.querySelector("#retry-button");

let renderer;
let scene;
let camera;
let controls;
let splat;
let initialCameraPosition;
let initialTarget;
let activeLanguage = "zh";
let loading = false;
let destroyed = false;

const copy = {
  zh: {
    preparing: "准备 3D 渲染器…",
    downloading: "正在下载场景数据…",
    processing: "正在解码并组装 3D 场景…",
    ready: "场景准备完成",
    unsupported: "当前浏览器未启用 WebGL 2。请更新系统浏览器，或继续查看高清全景图。",
    failed: "3D 数据加载失败，可能是网络中断或设备显存不足。高清全景图仍可正常查看。",
    reset: "重置视角",
    fullscreen: "进入全屏",
    exitFullscreen: "退出全屏",
    panoramaStart: "先看全景图",
    panoramaStop: "停止全景移动"
  },
  en: {
    preparing: "Preparing 3D renderer…",
    downloading: "Downloading scene data…",
    processing: "Decoding and assembling the 3D scene…",
    ready: "Scene ready",
    unsupported: "WebGL 2 is unavailable in this browser. Update your browser or continue with the high-resolution panorama.",
    failed: "The 3D data could not load. The connection may have dropped or the device may be low on graphics memory. The panorama remains available.",
    reset: "Reset view",
    fullscreen: "Enter fullscreen",
    exitFullscreen: "Exit fullscreen",
    panoramaStart: "View panorama",
    panoramaStop: "Stop panorama motion"
  }
};

function hasWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    // Allow software/fallback WebGL 2 implementations as well. Some mobile
    // wallet browsers report them as a performance caveat even though the
    // scene is still usable at our reduced mobile pixel ratio.
    return Boolean(canvas.getContext("webgl2", { powerPreference: "high-performance" }));
  } catch {
    return false;
  }
}

function isMobileDevice() {
  return matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function updateProgress(value, detail) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  progressBar.style.width = `${percent}%`;
  progressLabel.textContent = `${percent}%`;
  if (detail) loadingDetail.textContent = detail;
}

function setLanguage(language) {
  activeLanguage = language;
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-zh][data-en]").forEach((element) => {
    const value = element.dataset[language];
    if (!value) return;
    if (element.id === "world-title") {
      const parts = value.split(language === "zh" ? "，" : " above ");
      element.textContent = "";
      if (parts.length === 2) {
        element.append(document.createTextNode(language === "zh" ? `${parts[0]}，` : `${parts[0]} above `));
        element.append(document.createElement("br"));
        element.append(document.createTextNode(parts[1]));
      } else {
        element.textContent = value;
      }
    } else {
      element.textContent = value;
    }
  });
  languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换到中文");
  resetButton.setAttribute("aria-label", copy[language].reset);
  updateFullscreenLabel();
  if (!loading && !shell.classList.contains("scene-ready")) {
    loadingDetail.textContent = copy[language].preparing;
  }
  panoramaButton.querySelector("span").textContent = shell.classList.contains("panorama-preview")
    ? copy[language].panoramaStop
    : copy[language].panoramaStart;
}

function updateFullscreenLabel() {
  fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? copy[activeLanguage].exitFullscreen : copy[activeLanguage].fullscreen);
}

function showFallback(message, error) {
  shell.classList.remove("is-loading", "scene-ready");
  loadingPanel.hidden = true;
  controlPanel.hidden = true;
  fallbackMessage.textContent = message;
  const diagnostic = error instanceof Error ? `${error.name}: ${error.message}` : String(error || "");
  diagnosticDetails.hidden = !diagnostic;
  diagnosticCode.textContent = diagnostic.slice(0, 800);
  fallbackPanel.hidden = false;
  loading = false;
}

function disposeScene() {
  destroyed = true;
  renderer?.setAnimationLoop(null);
  controls?.dispose();
  splat?.dispose();
  renderer?.dispose();
  renderer?.domElement.remove();
  renderer = null;
  scene = null;
  camera = null;
  controls = null;
  splat = null;
}

function fitCameraToSplat() {
  const box = splat.getBoundingBox(true);
  if (box.isEmpty()) throw new Error("The SPZ scene contains no visible bounds.");

  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.5, 0.25);

  // This asset is a 360-degree Gaussian world captured around the origin.
  // Keep the camera inside its empty capture cavity and orbit over a tiny
  // radius so dragging feels like turning one's head, not circling a model.
  const captureOrigin = new THREE.Vector3(0, 0, 0);
  const viewRadius = Math.min(Math.max(radius * 0.00055, 0.012), 0.03);
  const maxViewRadius = Math.min(Math.max(radius * 0.006, 0.12), 0.32);

  camera.near = 0.01;
  camera.far = Math.max(radius * 4, 120);
  // Hunyuan's world export is Z-up. Start along the negative Y axis so the
  // first view faces the central path instead of the ground shell. A modest
  // downward pitch compensates for the source capture's slightly raised gaze.
  const openingPitch = THREE.MathUtils.degToRad(28);
  camera.position.set(
    captureOrigin.x,
    captureOrigin.y - Math.cos(openingPitch) * viewRadius,
    captureOrigin.z + Math.sin(openingPitch) * viewRadius
  );
  camera.lookAt(captureOrigin);
  camera.updateProjectionMatrix();

  controls.target.copy(captureOrigin);
  controls.minDistance = Math.max(viewRadius * 0.45, 0.006);
  controls.maxDistance = maxViewRadius;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.55;
  controls.update();

  initialCameraPosition = camera.position.clone();
  initialTarget = captureOrigin.clone();
}

function resizeRenderer() {
  if (!renderer || !camera) return;
  const width = Math.max(canvasHost.clientWidth, 1);
  const height = Math.max(canvasHost.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

export async function startExperience() {
  if (loading || shell.classList.contains("scene-ready")) return;

  fallbackPanel.hidden = true;
  shell.classList.remove("panorama-preview");

  if (!hasWebGL2()) {
    showFallback(copy[activeLanguage].unsupported);
    return;
  }

  loading = true;
  destroyed = false;
  shell.classList.add("is-loading");
  loadingPanel.hidden = false;
  updateProgress(2, copy[activeLanguage].preparing);

  try {
    const mobile = isMobileDevice();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(58, 1, 0.01, 1000);
    camera.up.set(0, 0, 1);

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x071118, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
    canvasHost.replaceChildren(renderer.domElement);

    const spark = new SparkRenderer({
      renderer,
      minSortIntervalMs: mobile ? 32 : 16
    });
    scene.add(spark);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.zoomToCursor = false;
    controls.autoRotate = false;
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    resizeRenderer();
    updateProgress(5, copy[activeLanguage].downloading);

    splat = new SplatMesh({
      url: ASSET_URL,
      nonLod: true,
      onProgress: (event) => {
        if (destroyed) return;
        if (event.lengthComputable && event.total > 0) {
          updateProgress(5 + (event.loaded / event.total) * 76, copy[activeLanguage].downloading);
        } else {
          updateProgress(Math.min(78, Number(progressLabel.textContent.replace("%", "")) + 1), copy[activeLanguage].downloading);
        }
      },
      onLoad: () => {
        if (!destroyed) updateProgress(84, copy[activeLanguage].processing);
      }
    });
    scene.add(splat);

    await splat.initialized;
    if (destroyed) return;

    updateProgress(94, copy[activeLanguage].processing);
    fitCameraToSplat();

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      controls.update(clock.getDelta());
      renderer.render(scene, camera);
    });

    updateProgress(100, copy[activeLanguage].ready);
    await new Promise((resolve) => setTimeout(resolve, 220));
    shell.classList.remove("is-loading");
    shell.classList.add("scene-ready");
    loadingPanel.hidden = true;
    controlPanel.hidden = false;
    loading = false;
  } catch (error) {
    console.error("Turing 3D scene failed to load", error);
    disposeScene();
    showFallback(copy[activeLanguage].failed, error);
  }
}

enterButton.addEventListener("click", startExperience);
retryButton.addEventListener("click", startExperience);

panoramaButton.addEventListener("click", () => {
  const active = shell.classList.toggle("panorama-preview");
  panoramaButton.setAttribute("aria-pressed", String(active));
  panoramaButton.querySelector("span").textContent = active ? copy[activeLanguage].panoramaStop : copy[activeLanguage].panoramaStart;
});

languageButton.addEventListener("click", () => setLanguage(activeLanguage === "zh" ? "en" : "zh"));

cancelButton.addEventListener("click", () => {
  disposeScene();
  location.reload();
});

resetButton.addEventListener("click", () => {
  if (!controls || !initialCameraPosition || !initialTarget) return;
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialTarget);
  controls.update();
});

fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
  } catch (error) {
    console.warn("Fullscreen request was declined", error);
  }
});

document.addEventListener("fullscreenchange", updateFullscreenLabel);
window.addEventListener("resize", resizeRenderer, { passive: true });
window.addEventListener("beforeunload", disposeScene, { once: true });
document.addEventListener("visibilitychange", () => {
  if (!renderer) return;
  if (document.hidden) renderer.setAnimationLoop(null);
  else renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
});

setLanguage("zh");
