let currentSegments = [];
let lastVideoId = "";
let isFetching = false;

function clickElement(el) {
  if (!el) return;

  const eventTypes = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
  
  const triggerEvents = (target) => {
    if (!target) return;
    eventTypes.forEach(type => {
      target.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    });
    if (typeof target.click === 'function') {
      target.click();
    }
  };

  // 1. Click target element
  triggerEvents(el);

  // 2. Click any nested <button>, <span>, or <div> inside it
  const children = el.querySelectorAll('button, span, div');
  children.forEach(child => triggerEvents(child));

  // 3. Click parent container if it's an ad slot wrapper
  if (el.parentElement) {
    triggerEvents(el.parentElement);
  }
}

function handleNativeAds(video) {
  const player = document.querySelector('.html5-video-player');
  if (!player) return;

  const isAdShowing = player.classList.contains('ad-showing') || 
                      player.classList.contains('ad-interrupting');

  if (isAdShowing) {
    video.muted = true;

    video.playbackRate = 16;
    if (!isNaN(video.duration) && video.duration > 0) {
      video.currentTime = video.duration;
    }

    const skipSelectors = [
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-skip-button-container button',
      'yt-skip-ad-button-renderer button',
      '.ytp-ad-skip-button-text',
      '[class*="ytp-ad-skip-button"]'
    ];

    for (const selector of skipSelectors) {
      const skipBtn = document.querySelector(selector);
      if (skipBtn) {
        clickElement(skipBtn);

        const innerBtn = skipBtn.querySelector('button');
        if (innerBtn) {
          clickElement(innerBtn);
        }
        break;
      }
    }
  }
}

async function fetchSponsorSegments(videoId) {
  if (isFetching) return;
  isFetching = true;

  try {
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["sponsor"]`;
    const response = await fetch(url);
    
    if (response.ok) {
      currentSegments = await response.json();
      console.log(`[Goated Skipper] Loaded ${currentSegments.length} sponsor segment(s) for${videoId}.`);
    } else {
      currentSegments = [];
    }
  } catch (err) {
    currentSegments = [];
  } finally {
    isFetching = false;
  }
}

function handleSponsorships(video) {
  if (!currentSegments || currentSegments.length === 0) return;

  const currentTime = video.currentTime;

  for (const item of currentSegments) {
    const [start, end] = item.segment;
    if (currentTime >= start && currentTime < end - 0.5) {
      console.log(`[Goated Skipper] Skipped sponsor: ${start.toFixed(1)}s ->${end.toFixed(1)}s`);
      video.currentTime = end;
      break;
    }
  }
}

function monitorPlayback() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');

  if (videoId && videoId !== lastVideoId) {
    lastVideoId = videoId;
    currentSegments = [];
    fetchSponsorSegments(videoId);
  }

  const video = document.querySelector('video');
  if (video) {
    handleNativeAds(video);
    handleSponsorships(video);
  }
}

setInterval(monitorPlayback, 250);