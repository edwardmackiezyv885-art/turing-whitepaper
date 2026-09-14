(function () {
  "use strict";

  const button = document.querySelector("#enter-button");
  const shell = document.querySelector(".world-shell");
  const loadingPanel = document.querySelector("#loading-panel");
  const loadingDetail = document.querySelector("#loading-detail");
  const progressBar = document.querySelector("#progress-bar");
  const progressLabel = document.querySelector("#progress-label");
  const fallbackPanel = document.querySelector("#fallback-panel");
  const fallbackMessage = document.querySelector("#fallback-message");
  const diagnosticDetails = document.querySelector("#diagnostic-details");
  const diagnosticCode = document.querySelector("#diagnostic-code");
  let runtimePromise;

  function setButtonReady() {
    button.disabled = false;
    button.setAttribute("aria-busy", "false");
  }

  function showLoading() {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    shell.classList.add("is-loading");
    fallbackPanel.hidden = true;
    loadingPanel.hidden = false;
    loadingDetail.textContent = document.documentElement.lang.startsWith("zh")
      ? "正在加载 3D 引擎…"
      : "Loading the 3D engine…";
    progressBar.style.width = "3%";
    progressLabel.textContent = "3%";
  }

  function showBootError(error) {
    shell.classList.remove("is-loading");
    loadingPanel.hidden = true;
    fallbackPanel.hidden = false;
    fallbackMessage.textContent = document.documentElement.lang.startsWith("zh")
      ? "3D 引擎脚本未能加载。请检查网络后重新加载页面。"
      : "The 3D engine script could not load. Check the connection and reload the page.";
    diagnosticDetails.hidden = false;
    diagnosticCode.textContent = `${error.name || "Error"}: ${error.message || String(error)}`;
    setButtonReady();
  }

  function loadRuntime() {
    if (window.TuringWorldRuntime?.startExperience) return Promise.resolve(window.TuringWorldRuntime);
    if (runtimePromise) return runtimePromise;

    runtimePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "./world-runtime.js?v=20260714-3";
      script.async = true;
      script.onload = () => {
        if (window.TuringWorldRuntime?.startExperience) resolve(window.TuringWorldRuntime);
        else reject(new Error("3D runtime loaded without a start function"));
      };
      script.onerror = () => reject(new Error("3D runtime request failed"));
      document.head.appendChild(script);
    });
    return runtimePromise;
  }

  async function handleEnter(event) {
    event.preventDefault();
    showLoading();
    try {
      const runtime = await loadRuntime();
      await runtime.startExperience();
    } catch (error) {
      console.error("Turing 3D bootstrap failed", error);
      showBootError(error);
    }
  }

  button.addEventListener("click", handleEnter);
  setButtonReady();
  window.TuringWorldBootReady = true;

  // Explicit local/QA hook; normal visitors still enter on a deliberate click.
  if (new URLSearchParams(location.search).get("world_autostart") === "1") {
    button.click();
  }
})();
