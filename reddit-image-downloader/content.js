chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scanImages") {
    const extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

    const images = Array.from(document.querySelectorAll("img"))
      .filter(img => {
        const src = img.src.toLowerCase();
        if (!extensions.some(ext => src.includes(ext))) return false;
        const excludedSources = ["www.redditstatic.com", "static"];
        if (excludedSources.some(domain => src.includes(domain))) return false;
        if (img.naturalWidth < 100 || img.naturalHeight < 100) return false;
        const excludedClasses = ["avatar", "icon", "header-img"];
        if (excludedClasses.some(cls => img.className.includes(cls))) return false;
        return true;
      })
      .map(img => img.src);

    const linkedImages = Array.from(document.querySelectorAll("a"))
      .map(a => a.href)
      .filter(href => extensions.some(ext => href.toLowerCase().includes(ext)));

    const allImages = [...new Set([...images, ...linkedImages])];

    // ✅ More precise selectors
    const titleEl = document.querySelector("a.title");
    const subredditEl = document.querySelector(".titlebox h1");

    const postTitle = titleEl?.textContent?.trim() || "Untitled";
    const subredditName = subredditEl?.textContent?.replace(/^r\//, "").trim() || "unknown";

    console.log("📋 Extracted postTitle:", postTitle);
    console.log("📋 Extracted subredditName:", subredditName);

    sendResponse({
      images: allImages,
      postTitle,
      subredditName
    });
  }
});
