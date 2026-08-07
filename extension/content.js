let currentSegments = [];
let lastVideoId = "";
let isFetching = false;
let isOverrideActive = false;

console.log("%c[Goated Chrome Extension] Extension loaded! Monitoring playback...", "color: #10b981; font-weight: bold; font-size: 14px;");

function activateSpeedTrap(video) {
  if (video.dataset.trapActive) return;
  video.dataset.trapActive = "true";
  console.log("%c[Goated Chrome Extension] Speed trap armed on video element.", "color: #3b82f6;");

  const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
  
  Object.defineProperty(video, 'playbackRate', {
    get: function() {
      return originalDescriptor.get.call(this);
    },
    set: function(value) {
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

    const isAdShowing = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
    
    if (!isAdShowing) {
      if (isOverrideActive) {
        console.log("%c[Goated Chrome Extension] Native ad ended. Restoring normal speed.", "color: #eab308;");
        isOverrideActive = false;
        video.playbackRate = 1; 
      }
      return;
    }

    if (!isOverrideActive) {
      console.log("%c[Goated Chrome Extension] Native Ad Detected! Initializing bypass mechanisms...", "color: #ef4444; font-weight: bold;");
    }

    activateSpeedTrap(video); 
    isOverrideActive = true;  
    video.muted = true;       

    if (!isNaN(video.duration) && video.duration > 0 && isFinite(video.duration)) {
      const safeEndTime = video.duration - 0.2;
      if (video.currentTime < safeEndTime) {
        console.log(`[Goated Chrome Extension] Fast-forwarding timeline: ${video.currentTime.toFixed(1)}s -> ${safeEndTime.toFixed(1)}s`);
        video.currentTime = safeEndTime;
      }
    }

    player.classList.remove('ad-showing', 'ad-interrupting');

    const skipBtn = document.querySelector('.ytp-ad-skip-button-modern, .ytp-ad-skip-button, [class*="skip-button"]');
    if (skipBtn && typeof skipBtn.click === 'function') {
      console.log("%c[Goated Chrome Extension] Skip button located! Sending click.", "color: #ec4899;");
      skipBtn.click();
    }
  } catch (adError) {
    console.error("%c[Goated Chrome Extension] Error inside handleNativeAds loop:", "color: #ef4444;", adError);
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
    if (item.segment) {
      const [start, end] = item.segment;
      if (currentTime >= start && currentTime < end - 0.5) {
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
  }
}

function monitorPlayback() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    if (videoId && videoId !== lastVideoId) {
      lastVideoId = videoId;
      currentSegments = [];
      isOverrideActive = false; 
      fetchSponsorSegments(videoId);
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

setInterval(monitorPlayback, 150);
