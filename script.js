"use strict";

/*
  Editable configuration:
  - Mail placement: CONFIG.mailBubblePosition + CONFIG.mailIconPosition
  - Page order/files: CONFIG.pageAssets
  - Ending text: CONFIG.finalMessage + CONFIG.finalMessagePosition
  - Animation intensity: CONFIG.effects + CONFIG.fireworks
*/

const CONFIG = {
  mailBubblePosition: {
    left: "50%",
    top: "40%",
    scale: 1.1,
    // Mobile tweak point: adjust vertical placement of the whole bubble on phones.
    mobileTop: "58%",
    mobileScale: 0.96
  },
  mailIconPosition: {
    left: "50%",
    bottom: "45%",
    scale: 1,
    // Mobile tweak point: use top anchor (not bottom) so icon tracks bubble cleanly on short/tall phones.
    mobileTop: "46%",
    mobileScale: 0.96
  },
  pageAssets: [
    ["assets/page1.png"],
    ["assets/page2.png", "assets/page 2.png"],
    ["assets/page3.png"],
    ["assets/page4.png"]
  ],
  finalMessage: "Happy 4 Years Love!",
  finalMessagePosition: {
    left: "50%",
    top: "25%",
    scale: 1,
    align: "center"
  },
  finalMessageFontFamily: "\"SVBold\", \"Palatino Linotype\", \"Book Antiqua\", Garamond, serif",
  effects: {
    starCount: 45,
    leafCount: 24
  },
  fireworks: {
    burstIntervalMs: 480,
    particlesPerBurst: 30,
    maxParticles: 420,
    minSpeed: 1.35,
    maxSpeed: 4.25,
    gravity: 0.03,
    friction: 0.985,
    decay: 0.0145,
    doubleBurstChance: 0.28
  }
};

const FIREWORK_COLORS = ["#ffd3ca", "#ffe5a3", "#ffd8ec", "#cde8ff", "#ffe7d2"];
const LETTER_TO_FINALE_FADE_MS = 550;
const FINALE_FIREWORK_DELAY_MS = 120;

document.addEventListener("DOMContentLoaded", () => {
  const refs = {
    sharedBg: document.getElementById("sharedBg"),
    scenes: {
      landing: document.getElementById("landingScene"),
      letter: document.getElementById("letterScene"),
      finale: document.getElementById("finaleScene")
    },
    starsLayer: document.getElementById("starsLayer"),
    leavesLayer: document.getElementById("leavesLayer"),
    mailZone: document.getElementById("mailZone"),
    mailBubble: document.getElementById("mailBubble"),
    mailIcon: document.getElementById("mailIcon"),
    mailFallback: document.getElementById("mailFallback"),
    audioToggle: document.getElementById("audioToggle"),
    pageStage: document.getElementById("pageStage"),
    pageImage: document.getElementById("pageImage"),
    pageFallback: document.getElementById("pageFallback"),
    pageIndicator: document.getElementById("pageIndicator"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    letterShell: document.getElementById("letterShell"),
    finaleMessage: document.getElementById("finaleMessage"),
    replayBtn: document.getElementById("replayBtn"),
    fireworksCanvas: document.getElementById("fireworksCanvas"),
    bgMusic: document.getElementById("bgMusic"),
    openMailSound: document.getElementById("openMailSound"),
    finaleMusic: document.getElementById("finaleMusic")
  };

  const state = {
    scene: "landing",
    currentPage: 0,
    userInteracted: false,
    soundEnabled: true,
    openMailActive: false,
    openMailTimer: 0,
    finaleTransitionTimer: 0,
    finaleTransitionActive: false,
    pageSourceCache: new Map(),
    pageRenderToken: 0,
    fireworks: {
      ctx: null,
      width: 0,
      height: 0,
      particles: [],
      rafId: 0,
      running: false,
      lastBurstAt: 0,
      intensityScale: 1
    }
  };

  const audioAvailable = {
    bg: true,
    open: true,
    finale: true
  };

  const audioManager = createAudioManager();

  applyConfig();
  installImageFallbacks();
  installAudioFallbacks();
  buildStars();
  buildLeaves();
  bindEvents();
  setScene("landing");
  renderPage(0, 0);
  preloadPages();
  setupFireworksCanvas();
  updateAudioButton();

  function applyConfig() {
    const bubblePosition = CONFIG.mailBubblePosition || CONFIG.mailPosition || {};
    const iconPosition = CONFIG.mailIconPosition || {};
    const finalPosition = CONFIG.finalMessagePosition || {};
    const root = document.documentElement;
    root.style.setProperty("--mail-bubble-left", bubblePosition.left || "50%");
    root.style.setProperty("--mail-bubble-top", bubblePosition.top || "70%");
    root.style.setProperty("--mail-bubble-scale", String(bubblePosition.scale ?? 1));
    root.style.setProperty("--mail-mobile-bubble-top", bubblePosition.mobileTop || bubblePosition.top || "58%");
    root.style.setProperty("--mail-mobile-bubble-scale", String(bubblePosition.mobileScale ?? bubblePosition.scale ?? 1));
    root.style.setProperty("--mail-icon-left", iconPosition.left || "50%");
    root.style.setProperty("--mail-icon-bottom", iconPosition.bottom || "28%");
    root.style.setProperty("--mail-icon-scale", String(iconPosition.scale ?? 1));
    root.style.setProperty("--mail-mobile-icon-top", iconPosition.mobileTop || "46%");
    root.style.setProperty("--mail-mobile-icon-scale", String(iconPosition.mobileScale ?? iconPosition.scale ?? 1));
    root.style.setProperty("--finale-message-left", finalPosition.left || "50%");
    root.style.setProperty("--finale-message-top", finalPosition.top || "50%");
    root.style.setProperty("--finale-message-scale", String(finalPosition.scale ?? 1));
    root.style.setProperty("--finale-message-align", finalPosition.align || "center");
    root.style.setProperty(
      "--finale-font-family",
      CONFIG.finalMessageFontFamily || "\"SVBold\", \"Palatino Linotype\", \"Book Antiqua\", Garamond, serif"
    );
    refs.finaleMessage.textContent = CONFIG.finalMessage;
  }

  function installImageFallbacks() {
    if (refs.sharedBg) {
      refs.sharedBg.addEventListener("error", () => {
        refs.sharedBg.classList.add("is-hidden");
      });
    }

    refs.mailBubble.addEventListener("error", () => {
      refs.mailBubble.classList.add("is-hidden");
      refs.mailZone.classList.add("bubble-missing");
      showMailFallbackIfNeeded();
    });

    refs.mailIcon.addEventListener("error", () => {
      refs.mailIcon.classList.add("is-hidden");
      showMailFallbackIfNeeded();
    });
  }

  function showMailFallbackIfNeeded() {
    const bubbleMissing = refs.mailBubble.classList.contains("is-hidden");
    const iconMissing = refs.mailIcon.classList.contains("is-hidden");
    if (bubbleMissing && iconMissing) {
      refs.mailFallback.hidden = false;
    }
  }

  function installAudioFallbacks() {
    refs.bgMusic.addEventListener("error", () => {
      audioAvailable.bg = false;
      syncSceneMusic();
      updateAudioButton();
    });

    refs.openMailSound.addEventListener("error", () => {
      audioAvailable.open = false;
      finishOpenMailSequence();
      updateAudioButton();
    });

    refs.finaleMusic.addEventListener("error", () => {
      audioAvailable.finale = false;
      syncSceneMusic();
      updateAudioButton();
    });

    refs.openMailSound.addEventListener("ended", () => {
      finishOpenMailSequence();
    });
  }

  function buildStars() {
    refs.starsLayer.innerHTML = "";
    for (let i = 0; i < CONFIG.effects.starCount; i += 1) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 70}%`;
      star.style.setProperty("--size", `${(Math.random() * 2.3 + 1).toFixed(2)}px`);
      star.style.setProperty("--twinkle-duration", `${(Math.random() * 4 + 2.4).toFixed(2)}s`);
      star.style.setProperty("--delay", `${(Math.random() * -7).toFixed(2)}s`);
      refs.starsLayer.appendChild(star);
    }
  }

  function buildLeaves() {
    refs.leavesLayer.innerHTML = "";
    for (let i = 0; i < CONFIG.effects.leafCount; i += 1) {
      const leaf = document.createElement("span");
      const startX = Math.random() * 100;
      const drift = (Math.random() * 14 + 6) * (Math.random() > 0.5 ? 1 : -1);
      leaf.className = "leaf";
      leaf.style.setProperty("--start-x", `${startX.toFixed(2)}vw`);
      leaf.style.setProperty("--drift", `${drift.toFixed(2)}vw`);
      leaf.style.setProperty("--spin", `${Math.round((Math.random() * 280 + 160) * (Math.random() > 0.5 ? 1 : -1))}deg`);
      leaf.style.setProperty("--leaf-size", `${(Math.random() * 16 + 12).toFixed(1)}px`);
      leaf.style.setProperty("--fall-duration", `${(Math.random() * 14 + 16).toFixed(2)}s`);
      leaf.style.setProperty("--delay", `${(Math.random() * -24).toFixed(2)}s`);
      refs.leavesLayer.appendChild(leaf);
    }
  }

  function bindEvents() {
    const unlockEvents = ["pointerdown", "keydown"];
    unlockEvents.forEach((eventName) => {
      document.addEventListener(eventName, onFirstInteraction, { once: true });
    });

    refs.audioToggle.addEventListener("click", () => {
      if (!state.userInteracted) {
        onFirstInteraction();
      }

      state.soundEnabled = !state.soundEnabled;
      if (!state.soundEnabled) {
        finishOpenMailSequence(true);
        audioManager.stopAll(true);
      } else {
        syncSceneMusic();
      }
      updateAudioButton();
    });

    refs.mailZone.addEventListener("click", () => {
      if (!state.userInteracted) {
        onFirstInteraction();
      }
      playOpenMail();
      window.setTimeout(() => {
        setScene("letter");
      }, 220);
    });

    refs.prevBtn.addEventListener("click", () => {
      if (state.currentPage === 0) {
        return;
      }
      renderPage(state.currentPage - 1, -1);
    });

    refs.nextBtn.addEventListener("click", () => {
      const lastPageIndex = CONFIG.pageAssets.length - 1;
      if (state.currentPage >= lastPageIndex) {
        enterFinale();
        return;
      }
      renderPage(state.currentPage + 1, 1);
    });

    refs.replayBtn.addEventListener("click", () => {
      replayExperience();
    });

    document.addEventListener("keydown", (event) => {
      if (state.scene !== "letter") {
        return;
      }
      if (event.key === "ArrowRight") {
        refs.nextBtn.click();
      } else if (event.key === "ArrowLeft") {
        refs.prevBtn.click();
      }
    });
  }

  function onFirstInteraction() {
    state.userInteracted = true;
    syncSceneMusic();
  }

  function updateAudioButton() {
    const nothingPlayable = !audioAvailable.bg && !audioAvailable.finale && !audioAvailable.open;
    if (nothingPlayable) {
      refs.audioToggle.textContent = "Sound Unavailable";
      refs.audioToggle.disabled = true;
      refs.audioToggle.setAttribute("aria-pressed", "false");
      return;
    }

    refs.audioToggle.disabled = false;
    refs.audioToggle.textContent = state.soundEnabled ? "Sound: On" : "Sound: Off";
    refs.audioToggle.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
  }

  function setScene(sceneName) {
    if (!refs.scenes[sceneName]) {
      return;
    }

    if (sceneName !== "finale") {
      resetFinaleTransition();
    }

    if (state.scene === "finale" && sceneName !== "finale") {
      stopFireworks();
    }

    state.scene = sceneName;
    Object.entries(refs.scenes).forEach(([name, sceneElement]) => {
      sceneElement.classList.toggle("active", name === sceneName);
    });

    syncSceneMusic();
  }

  function syncSceneMusic() {
    if (!state.userInteracted || !state.soundEnabled) {
      audioManager.stopAll(true);
      return;
    }

    if (state.openMailActive) {
      return;
    }

    if (state.scene === "finale" && audioAvailable.finale) {
      audioManager.playExclusive("finale", false);
      return;
    }

    if (audioAvailable.bg) {
      audioManager.playExclusive("bg", false);
      return;
    }

    audioManager.stopAll(true);
  }

  function playOpenMail() {
    if (!state.soundEnabled || !state.userInteracted || !audioAvailable.open) {
      return;
    }

    state.openMailActive = true;
    window.clearTimeout(state.openMailTimer);
    audioManager.playExclusive("open", true);
    state.openMailTimer = window.setTimeout(() => {
      finishOpenMailSequence();
    }, getAudioDurationMs(refs.openMailSound, 1400));
  }

  function finishOpenMailSequence(forceClearOnly = false) {
    if (!state.openMailActive && !forceClearOnly) {
      return;
    }
    state.openMailActive = false;
    window.clearTimeout(state.openMailTimer);
    state.openMailTimer = 0;

    if (!forceClearOnly) {
      syncSceneMusic();
    }
  }

  async function renderPage(index, direction) {
    const pageCount = CONFIG.pageAssets.length;
    const clamped = Math.max(0, Math.min(index, pageCount - 1));
    state.currentPage = clamped;

    const token = ++state.pageRenderToken;
    refs.pageIndicator.textContent = `${clamped + 1} / ${pageCount}`;
    refs.prevBtn.disabled = clamped === 0;
    refs.nextBtn.disabled = false;
    refs.nextBtn.textContent = clamped === pageCount - 1 ? "Celebrate" : "Next";
    animatePageStage(direction);

    // Hide fallback first; show it again only on a confirmed load failure.
    refs.pageFallback.hidden = true;

    const source = await resolvePageSource(clamped);
    if (token !== state.pageRenderToken) {
      return;
    }

    if (source) {
      refs.pageImage.hidden = false;
      refs.pageImage.alt = `Love letter page ${clamped + 1}`;
      refs.pageImage.src = source;
      return;
    }

    showPageFallback(clamped);
  }

  function showPageFallback(pageIndex) {
    refs.pageImage.hidden = true;
    refs.pageImage.removeAttribute("src");
    refs.pageFallback.hidden = false;
    const fallbackSub = refs.pageFallback.querySelector(".fallback-sub");
    fallbackSub.textContent = `Page ${pageIndex + 1} image could not be loaded.`;
  }

  function animatePageStage(direction) {
    refs.pageStage.classList.remove("stage-next", "stage-prev");
    if (direction === 0) {
      return;
    }
    void refs.pageStage.offsetWidth;
    refs.pageStage.classList.add(direction > 0 ? "stage-next" : "stage-prev");
  }

  async function resolvePageSource(pageIndex) {
    if (state.pageSourceCache.has(pageIndex)) {
      return state.pageSourceCache.get(pageIndex);
    }

    const candidates = CONFIG.pageAssets[pageIndex] || [];
    for (const candidate of candidates) {
      // Try each candidate path in order for graceful filename fallback.
      // eslint-disable-next-line no-await-in-loop
      const exists = await probeImage(candidate);
      if (exists) {
        state.pageSourceCache.set(pageIndex, candidate);
        return candidate;
      }
    }

    state.pageSourceCache.set(pageIndex, null);
    return null;
  }

  function preloadPages() {
    CONFIG.pageAssets.forEach((_, index) => {
      resolvePageSource(index);
    });
  }

  function probeImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  function enterFinale() {
    if (state.finaleTransitionActive || state.scene !== "letter") {
      return;
    }

    state.finaleTransitionActive = true;
    finishOpenMailSequence(true);
    refs.prevBtn.disabled = true;
    refs.nextBtn.disabled = true;
    if (refs.letterShell) {
      refs.letterShell.classList.add("is-fading-out");
    }

    window.clearTimeout(state.finaleTransitionTimer);
    state.finaleTransitionTimer = window.setTimeout(() => {
      if (refs.letterShell) {
        refs.letterShell.classList.remove("is-fading-out");
      }
      setScene("finale");

      state.finaleTransitionTimer = window.setTimeout(() => {
        startFireworks();
        state.finaleTransitionActive = false;
        state.finaleTransitionTimer = 0;
      }, FINALE_FIREWORK_DELAY_MS);
    }, LETTER_TO_FINALE_FADE_MS);
  }

  function replayExperience() {
    resetFinaleTransition();
    stopFireworks();
    finishOpenMailSequence(true);
    audioManager.stopAll(true);
    renderPage(0, 0);
    setScene("landing");
  }

  function resetFinaleTransition() {
    state.finaleTransitionActive = false;
    if (state.finaleTransitionTimer) {
      window.clearTimeout(state.finaleTransitionTimer);
      state.finaleTransitionTimer = 0;
    }
    if (refs.letterShell) {
      refs.letterShell.classList.remove("is-fading-out");
    }
  }

  function setupFireworksCanvas() {
    const ctx = refs.fireworksCanvas.getContext("2d", {
      alpha: true,
      desynchronized: true
    });
    if (!ctx) {
      return;
    }
    state.fireworks.ctx = ctx;
    resizeFireworksCanvas();
    window.addEventListener("resize", resizeFireworksCanvas, { passive: true });
  }

  function resizeFireworksCanvas() {
    if (!state.fireworks.ctx) {
      return;
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const rawDpr = window.devicePixelRatio || 1;
    const dprCap = width < 520 ? 1.5 : 2;
    const dpr = Math.min(rawDpr, dprCap);
    refs.fireworksCanvas.width = Math.floor(width * dpr);
    refs.fireworksCanvas.height = Math.floor(height * dpr);
    refs.fireworksCanvas.style.width = `${width}px`;
    refs.fireworksCanvas.style.height = `${height}px`;
    state.fireworks.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.fireworks.width = width;
    state.fireworks.height = height;

    if (width < 520) {
      state.fireworks.intensityScale = 0.78;
    } else if (width < 880) {
      state.fireworks.intensityScale = 0.92;
    } else {
      state.fireworks.intensityScale = 1;
    }
  }

  function startFireworks() {
    if (!state.fireworks.ctx) {
      return;
    }
    stopFireworks();
    state.fireworks.running = true;
    state.fireworks.particles = [];
    state.fireworks.lastBurstAt = performance.now() - CONFIG.fireworks.burstIntervalMs;
    state.fireworks.rafId = window.requestAnimationFrame(animateFireworks);
  }

  function stopFireworks() {
    state.fireworks.running = false;
    state.fireworks.particles = [];
    if (state.fireworks.rafId) {
      window.cancelAnimationFrame(state.fireworks.rafId);
      state.fireworks.rafId = 0;
    }
    if (state.fireworks.ctx) {
      state.fireworks.ctx.clearRect(0, 0, state.fireworks.width, state.fireworks.height);
    }
  }

  function spawnBurst(scale = 1) {
    const x = state.fireworks.width * (0.17 + Math.random() * 0.66);
    const y = state.fireworks.height * (0.16 + Math.random() * 0.42);
    const baseCount = Math.max(12, Math.round(CONFIG.fireworks.particlesPerBurst * state.fireworks.intensityScale * scale));
    const accentCount = Math.round(baseCount * 0.32);

    for (let i = 0; i < baseCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = CONFIG.fireworks.minSpeed + Math.random() * (CONFIG.fireworks.maxSpeed - CONFIG.fireworks.minSpeed);
      state.fireworks.particles.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: CONFIG.fireworks.decay * (0.86 + Math.random() * 0.34),
        radius: Math.random() * 1.85 + 1.25,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
      });
    }

    for (let i = 0; i < accentCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (CONFIG.fireworks.minSpeed * 0.5) + Math.random() * (CONFIG.fireworks.maxSpeed * 0.45);
      state.fireworks.particles.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.95,
        decay: CONFIG.fireworks.decay * (0.94 + Math.random() * 0.3),
        radius: Math.random() * 1.2 + 1,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
      });
    }
  }

  function animateFireworks(now) {
    if (!state.fireworks.running || !state.fireworks.ctx) {
      return;
    }

    const ctx = state.fireworks.ctx;
    ctx.clearRect(0, 0, state.fireworks.width, state.fireworks.height);

    if (now - state.fireworks.lastBurstAt >= CONFIG.fireworks.burstIntervalMs) {
      spawnBurst(1);
      if (Math.random() < CONFIG.fireworks.doubleBurstChance) {
        spawnBurst(0.7);
      }
      state.fireworks.lastBurstAt = now;
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const nextParticles = [];

    for (const particle of state.fireworks.particles) {
      particle.px = particle.x;
      particle.py = particle.y;
      particle.vx *= CONFIG.fireworks.friction;
      particle.vy = (particle.vy * CONFIG.fireworks.friction) + CONFIG.fireworks.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.radius *= 0.996;

      if (particle.life > 0) {
        nextParticles.push(particle);
        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(0.75, particle.radius * 0.9);
        ctx.beginPath();
        ctx.moveTo(particle.px, particle.py);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
    state.fireworks.particles = nextParticles;

    if (state.fireworks.particles.length > CONFIG.fireworks.maxParticles) {
      state.fireworks.particles.splice(0, state.fireworks.particles.length - CONFIG.fireworks.maxParticles);
    }

    state.fireworks.rafId = window.requestAnimationFrame(animateFireworks);
  }

  function createAudioManager() {
    const tracks = {
      bg: refs.bgMusic,
      open: refs.openMailSound,
      finale: refs.finaleMusic
    };
    let activeTrackId = null;

    function stopTrack(trackId, resetTime) {
      const track = tracks[trackId];
      if (!track) {
        return;
      }
      track.pause();
      if (resetTime) {
        track.currentTime = 0;
      }
      if (activeTrackId === trackId) {
        activeTrackId = null;
      }
    }

    function playExclusive(trackId, restartFromStart) {
      const target = tracks[trackId];
      if (!target || !audioAvailable[trackId]) {
        return;
      }

      Object.keys(tracks).forEach((id) => {
        if (id !== trackId) {
          stopTrack(id, id === "open");
        }
      });

      if (restartFromStart) {
        target.currentTime = 0;
      }
      safePlay(target);
      activeTrackId = trackId;
    }

    function stopAll(resetOpenTime) {
      Object.keys(tracks).forEach((trackId) => {
        const shouldReset = trackId === "open" ? resetOpenTime : false;
        stopTrack(trackId, shouldReset);
      });
    }

    return {
      playExclusive,
      stopAll
    };
  }

  function getAudioDurationMs(audioEl, fallbackMs) {
    const durationSec = Number(audioEl.duration);
    if (Number.isFinite(durationSec) && durationSec > 0) {
      return Math.round((durationSec * 1000) + 120);
    }
    return fallbackMs;
  }

  function safePlay(audio) {
    audio.play().catch(() => {
      // Ignore autoplay or decode errors so visual flow continues.
    });
  }
});
