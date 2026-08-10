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

    const buttonShape = document.querySelector('.ytDislikeButtonViewModelHost .ytSpecButtonShapeNextHost');

    if (!buttonShape) return;
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
      if (grandParent && grandParent.classList.contains('yt-spec-button-shape-next--segmented-start')) {
        grandParent.style.maxWidth = 'none';
        grandParent.style.width = 'auto';
      }
    }

    let textNode = buttonShape.querySelector('#ext-dislike-text');
    if (!textNode) {
      textNode = document.createElement('div');
      textNode.id = 'ext-dislike-text';
      textNode.style.marginLeft = '6px';
      textNode.style.display = 'inline-block';
      textNode.style.verticalAlign = 'middle';
      textNode.style.whiteSpace = 'nowrap';
      textNode.style.width = 'auto';
      buttonShape.appendChild(textNode);
    }

    if (textNode.textContent !== dislikesText) {
      textNode.textContent = dislikesText;
    }
  } catch (error) {
    console.log("%c[Goated Chrome Extension] Failed to render dislike count D:", "color: #ff0505f0", error);
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

  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'dark') {
      isDark = document.documentElement.hasAttribute('dark');
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

setInterval(monitorPlayback, 150);
