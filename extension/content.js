let currentSegments = [];
let lastVideoId = "";
let isFetching = false;
let isOverrideActive = false;
let globalDislikesCount = "";

console.log("%c[Goated Chrome Extension] Extension loaded! Monitoring playback...", "color: #10b981; font-weight: bold; font-size: 14px;");

function activateSpeedTrap(video) {
  if (video.dataset.trapActive) {
    if (isOverrideActive && video.playbackRate !== 16) {
      video.playbackRate = 16;
    }
    return;
  }
  video.dataset.trapActive = "true";
  console.log("%c[Goated Chrome Extension] Speed trap armed on video element.", "color: #3b82f6;");

  const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');

  Object.defineProperty(video, 'playbackRate', {
    get: function () {
      return originalDescriptor.get.call(this);
    },
    set: function (value) {
      if (isOverrideActive) {
        originalDescriptor.set.call(this, 16);
      } else {
        originalDescriptor.set.call(this, value);
      }
    },
    configurable: true
  });
}

function handleNativeAds(video) {
  try {
    const player = document.querySelector('.html5-video-player');
    if (!player) return;

    const isAdShowing = player.classList.contains('ad-showing') ||
      player.classList.contains('ad-interrupting') ||
      !!document.querySelector('.ytp-ad-player-overlay, .ytp-ad-skip-button-slot');

    if (!isAdShowing) {
      if (isOverrideActive) {
        console.log("%c[Goated Chrome Extension] Ads cleared. Restoring speed.", "color: #eab308;");
        isOverrideActive = false;
        video.playbackRate = 1;
      }
      return;
    }

    isOverrideActive = true;
    video.muted = true;

    activateSpeedTrap(video);
    video.playbackRate = 16;

    if (video.duration && isFinite(video.duration) && video.duration > 0.3) {
      const skipTarget = video.duration - 0.3;
      if (video.currentTime < skipTarget) {
        video.currentTime = skipTarget;
      }
    }


    const skipBtn = document.querySelector('.ytp-ad-skip-button-modern, .ytp-ad-skip-button, .ytp-skip-ad-button, [class*="skip-button"]');
    if (skipBtn && typeof skipBtn.click === 'function') {
      skipBtn.click();
    }
  } catch (adError) {
    console.log("[Goated Chrome Extension] Guarded ad lifecycle shift handled safely.");
  }
}

async function fetchSponsorSegments(videoId) {
  if (isFetching) return;
  isFetching = true;
  console.log(`%c[Goated Chrome Extension] Fetching database records for Video ID: ${videoId}...`, "color: #8b5cf6;");

  try {
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`;
    const response = await fetch(url);
    if (response.ok) {
      currentSegments = await response.json();
      console.log(`%c[Goated Chrome Extension] Found ${currentSegments.length} segment(s) to track.`, "color: #10b981; font-weight: bold;");
    } else {
      console.log(`%c[Goated Chrome Extension] Database returned code ${response.status}.`, "color: #6b7280;");
      currentSegments = [];
    }
  } catch (err) {
    console.error("%c[Goated Chrome Extension] Network Fetch Failed:", "color: #ef4444;", err);
    currentSegments = [];
  } finally {
    isFetching = false;
  }
}

function handleSponsorships(video) {
  if (isOverrideActive || !currentSegments || currentSegments.length === 0) return;
  const currentTime = video.currentTime;

  for (const item of currentSegments) {
    if (!item.segment) continue;

    const [start, end] = item.segment;

    if (currentTime < start || currentTime >= end - 0.5) continue;

    console.log(`%c[Goated Chrome Extension] Skipping segment: ${start.toFixed(1)}s -> ${end.toFixed(1)}s`, "color: #10b981; font-weight: bold;");
    video.currentTime = end;

    const toast = document.createElement("div");
    toast.innerText = "we skipped the annoying sponsorship / talking for money bit :)";
    toast.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(16, 185, 129, 0.95);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-family: Roboto, Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity 0.5s ease-out;
    `;

    const playerElement = document.querySelector('.html5-video-player') || document.body;
    playerElement.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 2500);

    break;
  }
}

function formatCount(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function handleDislikes(videoId) {
  console.log(`%c[Goated Chrome Extension] Requesting Dislike Data via Proxy for: ${videoId}`, "color: #3b82f6;");

  window.dispatchEvent(new CustomEvent("FETCH_DISLIKES", {
    detail: { videoId }
  }));
}

window.addEventListener("DISLIKES_RESPONSE", (event) => {
  const { videoId, data } = event.detail;
  if (!data || data.dislikes === undefined) return;

  console.log(`%c[Goated Chrome Extension] Found ${data.dislikes} dislikes :)`, "color: #9ffa75;");

  globalDislikesCount = formatCount(data.dislikes);
  renderDislikes(globalDislikesCount);
});

function renderDislikes(dislikesText) {
  try {
    if (!dislikesText) return;

    if (!dislikesText) return;

    const buttonShapes = document.querySelectorAll(
      '.ytDislikeButtonViewModelHost button, dislike-button-view-model button, .ytDislikeButtonViewModelHost .ytSpecButtonShapeNextHost'
    );

    if (buttonShapes.length === 0) {
      return;
    }

    buttonShapes.forEach((buttonShape) => {
      buttonShape.style.width = 'auto';
      buttonShape.style.maxWidth = 'none';
      buttonShape.style.minWidth = 'max-content';
      buttonShape.style.paddingRight = '12px';
      buttonShape.style.display = 'inline-flex';
      buttonShape.style.alignItems = 'center';
      buttonShape.style.justifyContent = 'center';

      const buttonParent = buttonShape.parentElement;
      if (buttonParent) {
        buttonParent.style.width = 'auto';
        buttonParent.style.maxWidth = 'none';
        buttonParent.style.display = 'flex';
        const grandParent = buttonParent.parentElement;
        if (grandParent && (grandParent.classList.contains('yt-spec-button-shape-next--segmented-start') || grandParent.classList.contains('yt-spec-button-shape-next--segmented-end'))) {
          grandParent.style.maxWidth = 'none';
          grandParent.style.width = 'auto';
        }
      }

      let textNode = buttonShape.querySelector('#ext-dislike-text');
      if (!textNode) {
        textNode = document.createElement('yt-formatted-string');
        textNode.id = 'ext-dislike-text';

        textNode.style.marginLeft = '6px';
        textNode.style.display = 'inline-block';
        textNode.style.verticalAlign = 'middle';
        textNode.style.whiteSpace = 'nowrap';
        textNode.style.width = 'auto';
        textNode.style.fontFamily = 'inherit';
        textNode.style.fontSize = 'inherit';
        textNode.style.fontWeight = 'inherit';
        textNode.style.color = 'inherit';

        buttonShape.appendChild(textNode);
      }

      if (textNode.textContent !== dislikesText) {
        textNode.textContent = dislikesText;
      }
    });
  } catch (error) {
    console.error("[Goated Chrome Extension] Failed to render dislike count:", error);
  }
}

window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  if (
    activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    )
  ) {
    return;
  }

  const video = document.querySelector('video');
  if (!video) return;

  if (e.key === '[') {
    e.preventDefault();
    activateSpeedTrap(video);
    const newSpeed = Math.max(0.5, video.playbackRate - 0.5);
    video.playbackRate = newSpeed;
  }

  if (e.key === ']') {
    e.preventDefault();
    activateSpeedTrap(video);
    const newSpeed = Math.min(16.0, video.playbackRate + 0.5);
    video.playbackRate = newSpeed;
  }

  if (e.key === '\\') {
    e.preventDefault();
    activateSpeedTrap(video);
    video.playbackRate = 1.0;
  }
});

function renderCustomSpeedChip() {
  try {
    const buttonShapes = document.querySelectorAll(
      '.ytp-variable-speed-panel-chips'
    );

    if (buttonShapes.length === 0) return;

    buttonShapes.forEach((buttonShape) => {
      buttonShape.style.setProperty('display', 'flex', 'important');
      buttonShape.style.setProperty('flex-wrap', 'wrap', 'important');
      buttonShape.style.setProperty('justify-content', 'flex-start', 'important');

      let speedBtn = buttonShape.querySelector('#ext-custom-speed3');
      if (!speedBtn) {
        speedBtn = document.createElement('button');
        speedBtn.id = 'ext-custom-speed3';

        speedBtn.style.cssText = `
          background-color: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1));
          color: var(--yt-spec-text-primary, #fff);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 4px 8px; /* Slightly leaner padding keeps the layout intact */
          margin: 3px;      /* Consistent spacing rules */
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          box-sizing: border-box;
        `;

        speedBtn.textContent = "3.0x";

        speedBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const video = document.querySelector('video');
          if (video) {
            activateSpeedTrap(video);
            video.playbackRate = 3.0;
          }

          const settingsButton = document.querySelector('.ytp-settings-button');
          if (settingsButton) settingsButton.click();
        });

        buttonShape.querySelectorAll('button, .ytp-speed-chip').forEach(nativeChip => {
          if (nativeChip.id !== 'ext-custom-speed') {
            nativeChip.style.setProperty('padding', '4px 8px', 'important');
            nativeChip.style.setProperty('margin', '3px', 'important');
            nativeChip.style.setProperty('font-size', '12px', 'important');
          }
        });

        buttonShape.insertBefore(speedBtn, buttonShape.firstElementChild);
      }

      let speedBtn2 = buttonShape.querySelector('#ext-custom-speed4');
      if (!speedBtn2) {
        speedBtn2 = document.createElement('button');
        speedBtn2.id = 'ext-custom-speed4';

        speedBtn2.style.cssText = `
          background-color: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1));
          color: var(--yt-spec-text-primary, #fff);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 4px 8px; /* Slightly leaner padding keeps the layout intact */
          margin: 3px;      /* Consistent spacing rules */
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          box-sizing: border-box;
        `;

        speedBtn2.textContent = "4.0x";

        speedBtn2.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const video = document.querySelector('video');
          if (video) {
            activateSpeedTrap(video);
            video.playbackRate = 4.0;
          }

          const settingsButton = document.querySelector('.ytp-settings-button');
          if (settingsButton) settingsButton.click();
        });

        buttonShape.querySelectorAll('button, .ytp-speed-chip').forEach(nativeChip => {
          if (nativeChip.id !== 'ext-custom-speed') {
            nativeChip.style.setProperty('padding', '4px 8px', 'important');
            nativeChip.style.setProperty('margin', '3px', 'important');
            nativeChip.style.setProperty('font-size', '12px', 'important');
          }
        });

        buttonShape.insertBefore(speedBtn2, buttonShape.firstElementChild);
      }

      let speedBtn3 = buttonShape.querySelector('#ext-custom-speed5');
      if (!speedBtn3) {
        speedBtn3 = document.createElement('button');
        speedBtn3.id = 'ext-custom-speed5';

        speedBtn3.style.cssText = `
          background-color: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1));
          color: var(--yt-spec-text-primary, #fff);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 4px 8px; /* Slightly leaner padding keeps the layout intact */
          margin: 3px;      /* Consistent spacing rules */
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          box-sizing: border-box;
        `;

        speedBtn3.textContent = "5.0x";

        speedBtn3.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const video = document.querySelector('video');
          if (video) {
            activateSpeedTrap(video);
            video.playbackRate = 5.0;
          }

          const settingsButton = document.querySelector('.ytp-settings-button');
          if (settingsButton) settingsButton.click();
        });

        buttonShape.querySelectorAll('button, .ytp-speed-chip').forEach(nativeChip => {
          if (nativeChip.id !== 'ext-custom-speed') {
            nativeChip.style.setProperty('padding', '4px 8px', 'important');
            nativeChip.style.setProperty('margin', '3px', 'important');
            nativeChip.style.setProperty('font-size', '12px', 'important');
          }
        });

        buttonShape.insertBefore(speedBtn3, buttonShape.firstElementChild);
      }
    });
  } catch (error) {
    console.error("[Goated Chrome Extension] Failed to render speed chip", error);
  }
}

var videoID = null;

function monitorPlayback() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    if (videoId && videoId !== lastVideoId) {
      lastVideoId = videoId;
      currentSegments = [];
      isOverrideActive = false;
      fetchSponsorSegments(videoId);
      destroyOldDislikeText();
      handleDislikes(videoId);
      videoID = videoId
    }

    const activeVideo = document.querySelector('.html5-main-video') || document.querySelector('video');
    if (activeVideo) {
      handleNativeAds(activeVideo);
      handleSponsorships(activeVideo);
    }
  } catch (loopError) {
    console.error("%c[Goated Chrome Extension] Core monitor loop error occurred:", "color: #ef4444;", loopError);
  }
}
var isDark = false;

function injectButton() {
  if (document.getElementById("custom-yt-btn")) return;

  const targetContainer = document.querySelector("#top-level-buttons-computed")
    || document.querySelector("ytd-menu-renderer ytd-segmented-button-renderer")
    || document.querySelector("#actions-inner #top-row #menu")
    || document.querySelector("yt-flexible-item-renderer-by-line");

  if (targetContainer) {
    const btn = document.createElement("button");
    btn.id = "custom-yt-btn";
    btn.innerText = "Download";

    // Using YouTube's action-button tokens ensures perfect dark/light/ambient matches
    btn.style.cssText = `
      background-color: #f2f2f2;
      color: var(--yt-spec-text-primary);
      border: none;
      padding: 0 16px;
      height: 40px; /* Matches standard modern YouTube action button height */
      border-radius: 20px; /* Perfectly round capsules matching layout guidelines */
      margin-left: 8px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      font-family: "Roboto", "Arial", sans-serif;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s cubic-bezier(0.05, 0, 0, 1);
    `;

    if (isDark) {
      btn.style.backgroundColor = "#363636";
    }

    btn.addEventListener("mouseenter", () => {
      btn.style.backgroundColor = isDark ? "#5f5f5f" : "#c3c2c2";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.backgroundColor = isDark ? "#363636" : "#f2f2f2";
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      alert("Opening download url for: " + window.location.href);
      window.open(`https://bergung.hoffnungfuerdiezukunft.net/#https://www.youtube.com/watch?v=${videoID}`, "_blank")
    });

    if (targetContainer.tagName === "YTD-SEGMENTED-BUTTON-RENDERER") {
      targetContainer.parentNode.insertBefore(btn, targetContainer.nextSibling);
    } else {
      targetContainer.appendChild(btn);
    }
  }
}

isDark = document.documentElement.hasAttribute('dark');

const observer = new MutationObserver((mutations) => {
  if (window.location.pathname !== "/watch") return;

  for (const mutation of mutations) {
    if (mutation.target.id === 'ext-dislike-text' || mutation.target.id === 'custom-yt-btn') {
      return;
    }
  }

  injectButton();
  if (globalDislikesCount) {
    renderDislikes(globalDislikesCount);
  }

  renderCustomSpeedChip();

  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'dark') {
      isDark = document.documentElement.hasAttribute('dark');
    }
  });
});

function destroyOldDislikeText() {
  try {
    const oldTextNode = document.getElementById('ext-dislike-text');
    if (oldTextNode) {
      oldTextNode.remove();
      console.log("%c[Goated Chrome Extension] Successfully destroyed old dislike text node.", "color: #ef4444; font-weight: bold;");
    }
  } catch (err) {
    console.error("[Goated Chrome Extension] Error destroying old text node:", err);
  }
}


observer.observe(document.body, { childList: true, subtree: true });

setInterval(monitorPlayback, 150);

let eggBuffer = "";
const MAX_BUFFER_LENGTH = 10;

window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return;
  }

  if (e.key.length === 1) {
    eggBuffer += e.key.toLowerCase();
    if (eggBuffer.length > MAX_BUFFER_LENGTH) {
      eggBuffer = eggBuffer.substring(eggBuffer.length - MAX_BUFFER_LENGTH);
    }
  }

  const key = e.key.toLowerCase();

  if (['s', 'p', 'i', 'n', 'y', 'r', 'g', 'b'].includes(key)) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (eggBuffer.endsWith("spiny")) {
    eggBuffer = "";
    toggleSpinyEasterEgg();
  }

  if (eggBuffer.endsWith("rgb")) {
    eggBuffer = "";
    toggleRGBEasterEgg();
  }
}, true);

function toggleSpinyEasterEgg() {
  const existingStyle = document.getElementById('ext-spiny-egg-css');

  if (existingStyle) {
    existingStyle.remove();
    console.log("%c[Goated Chrome Extension] Spiny mode deactivated.", "color: #ef4444;");
    return;
  }

  console.log("%c[Goated Chrome Extension] spiny :3", "color: #9a24fa; font-weight: bold; font-size: 16px;");

  const styleNode = document.createElement('style');
  styleNode.id = 'ext-spiny-egg-css';

  styleNode.textContent = `
    @keyframes constantSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .html5-main-video, video {
      animation: constantSpin 2s linear infinite !important;
      transform-origin: center center !important;
    }
  `;

  document.head.appendChild(styleNode);
}

function toggleRGBEasterEgg() {
  const existingStyle = document.getElementById('ext-rgb-egg-css');

  if (existingStyle) {
    existingStyle.remove();
    console.log("%c[Goated Chrome Extension] RGB mode deactivated.", "color: #ef4444;");
    return;
  }

  console.log("%c[Goated Chrome Extension] RGB :3", "color: #9a24fa; font-weight: bold; font-size: 16px;");

  const styleNode = document.createElement('style');
  styleNode.id = 'ext-rgb-egg-css';

  styleNode.textContent = `
    @keyframes rgbShift {
      0% { color: #ff0000; fill: #ff0000; }
      20% { color: #ff00ff; fill: #ff00ff; }
      40% { color: #0000ff; fill: #0000ff; }
      60% { color: #00ffff; fill: #00ffff; }
      80% { color: #00ff00; fill: #00ff00; }
      100% { color: #ff0000; fill: #ff0000; }
    }

    #video-title, 
    ytd-watch-metadata #title h1,
    .yt-core-attributed-string,
    #channel-name a,
    #text-container,
    ytd-guide-entry-renderer span {
      animation: rgbShift 4s linear infinite !important;
    }

    yt-icon, 
    svg path {
      animation: rgbShift 4s linear infinite !important;
    }
    
    #custom-yt-btn {
      animation: rgbShift 4s linear infinite !important;
      border: 1px solid currentColor !important;
    }
  `;

  document.head.appendChild(styleNode);
}


