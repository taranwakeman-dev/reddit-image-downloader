console.log("🔧 Background service worker loaded");

importScripts("jszip.min.js");

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "downloadImage") {
    const url = msg.url;

    try {
      const rawName = url.split("/").pop().split("?")[0].split("#")[0] || "image";
      const safeName = rawName.replace(/[^\w.-]/g, "_");
      const extMatch = safeName.match(/\.\w+$/);
      const filename = extMatch ? safeName : `${safeName}.jpg`;

      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
    } catch (err) {
      console.error("Download error:", err);
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "downloadZip") {
    const { urls, postTitle = "Untitled", subredditName = "unknown" } = msg;
    console.log("🎒 DownloadZip action triggered");
    console.log("Post title:", postTitle);
    console.log("Subreddit:", subredditName);

    const zip = new JSZip();
    const folder = zip.folder("RedditImages");

    const fetchImage = async (url, index) => {
      try {
        console.log(`🔍 Fetching image [${index}]: ${url}`);
        const response = await fetch(url);
        const blob = await response.blob();
        console.log(`✅ Fetched image [${index}]`);

        const rawName = url.split("/").pop().split("?")[0].split("#")[0] || `image${index}.jpg`;
        const safeName = rawName.replace(/[^\w.-]/g, "_");
        folder.file(safeName, blob);
      } catch (err) {
        console.error("🚫 Failed to fetch image:", url, err);
      }
    };

    Promise.all(urls.map((url, i) => fetchImage(url, i))).then(() => {
      zip.generateAsync({ type: "base64" }).then((base64) => {
        console.log("📁 ZIP file encoded, preparing download");

        const cleanTitle = postTitle.replace(/[^\w.-]/g, "_").slice(0, 50);
        const cleanSub = subredditName.replace(/[^\w.-]/g, "_");
        const zipFileName = `r_${cleanSub}_${cleanTitle}.zip`;

        const dataUrl = `data:application/zip;base64,${base64}`;

        chrome.downloads.download({
          url: dataUrl,
          filename: zipFileName,
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Download failed:", chrome.runtime.lastError.message);
          } else {
            console.log("✅ ZIP download triggered:", downloadId);
          }
        });
      });
    });
  }
});
