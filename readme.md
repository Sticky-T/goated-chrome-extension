Goated Chrome Extension automatically skips to the end of ads and skips sponsorships!!

The folder for the extension should be called extension, it might be nested deep in the files depending on how you unzip and download it


To install, do the following:

1.) For Chrome profiles with no management / restriction --
      Download the repo as a .zip and unzip it into your downloads folder (You can delete readme.md if you want)
      Then, go to the address bar and type in "chrome://extensions"
      Go to the top right and turn on Developer Mode
      Then click the Load Unpacked button and find your folder, then select it
      Finally, enable the extension and you're good to go!!!

2.) For Chrome profiles with management / restriction --
      Then, make sure that your bookmarks bar is shown
      Add a new bookmark, and name it something like "ad-skipper" (or whatever you want)
      Then, paste this as the URL: "javascript:(function(){const run=()=>{let currentSegments=[];let lastVideoId="";let isFetching=false;function clickElement(el){if(!el)return;const eventTypes=['pointerdown','mousedown','pointerup','mouseup','click'];const triggerEvents=(target)=>{if(!target)return;eventTypes.forEach(type=>{target.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window}));});if(typeof target.click==='function'){target.click();}};triggerEvents(el);const children=el.querySelectorAll('button, span, div');children.forEach(child=>triggerEvents(child));if(el.parentElement){triggerEvents(el.parentElement);}}function handleNativeAds(video){const player=document.querySelector('.html5-video-player');if(!player)return;const isAdShowing=player.classList.contains('ad-showing')||player.classList.contains('ad-interrupting');if(isAdShowing){video.muted=true;video.playbackRate=16;if(!isNaN(video.duration)&&video.duration>0){video.currentTime=video.duration;}const skipSelectors=['button.ytp-ad-skip-button-modern','.ytp-ad-skip-button-modern','.ytp-ad-skip-button','.ytp-skip-ad-button','.ytp-ad-skip-button-slot button','.ytp-ad-skip-button-container button','yt-skip-ad-button-renderer button','.ytp-ad-skip-button-text','[class*="ytp-ad-skip-button"]'];for(const selector of skipSelectors){const skipBtn=document.querySelector(selector);if(skipBtn){clickElement(skipBtn);const innerBtn=skipBtn.querySelector('button');if(innerBtn){clickElement(innerBtn);}break;}}}}async function fetchSponsorSegments(videoId){if(isFetching)return;isFetching=true;try{const url='https://ajay.app["sponsor"]';const response=await fetch(url);if(response.ok){currentSegments=await response.json();console.log('[Goated Skipper] Loaded '+currentSegments.length+' sponsor segment(s) for '+videoId+'.');}else{currentSegments=[];}}catch(err){currentSegments=[];}finally{isFetching=false;}}function handleSponsorships(video){if(!currentSegments||currentSegments.length===0)return;const currentTime=video.currentTime;for(const item of currentSegments){const[start,end]=item.segment;if(currentTime>=start&&currentTime<end-0.5){console.log('[Goated Skipper] Skipped sponsor: '+start.toFixed(1)+'s -> '+end.toFixed(1)+'s');video.currentTime=end;break;}}}function monitorPlayback(){const urlParams=new URLSearchParams(window.location.search);const videoId=urlParams.get('v');if(videoId&&videoId !==lastVideoId){lastVideoId=videoId;currentSegments=[];fetchSponsorSegments(videoId);}const video=document.querySelector('video');if(video){handleNativeAds(video);handleSponsorships(video);}}setInterval(monitorPlayback,250);console.log('[Goated Skipper] Extension initialized successfully.');};if(window.top===window){run();}else{try{window.top.eval('('+run.toString()+')()');}catch(e){console.error('[Goated Skipper] Failed context injection:',e);}}})();"
      Now, whenever you are on a Youtube video, click this at the start and it will skip ads and sponsorships
      IMPORTANT: Since this is just a bookmarklet, you will have to click the Skip Ad button yourself, but you still won't have to wait out the button appearing, as bookmarklets just simply cannot run click events :(



I hope you find this extension useful!!! :)