window.addEventListener("FETCH_DISLIKES", async (event) => {
  const { videoId } = event.detail;
  const apiUrl = `https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();

    // Send the data safely back down to the MAIN world
    window.dispatchEvent(new CustomEvent("DISLIKES_RESPONSE", { 
      detail: { videoId, data } 
    }));
  } catch (err) {
    console.error("[Goated Chrome Extension] Proxy Fetch Failed:", err);
  }
});
