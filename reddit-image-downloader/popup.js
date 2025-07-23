function displayGallery(images) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  images.forEach(({ src, width, height }) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thumb";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = src;

    const img = document.createElement("img");
    img.src = src;
    img.className = "preview";

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.textContent = `${width} x ${height}`;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(img);
    wrapper.appendChild(overlay);
    gallery.appendChild(wrapper);
  });
}

// Scan page and show filtered gallery
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }, () => {
    chrome.tabs.sendMessage(tab.id, { action: "scanImages" }, (response) => {
      const rawImages = response.images;
      const resolutionMap = new Map();
      let loadedCount = 0;

      rawImages.forEach((src) => {
        const img = new Image();
        img.src = src;

        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;

          if (width < 150 || height < 150) {
            loadedCount++;
            if (loadedCount === rawImages.length) {
              displayGallery([...resolutionMap.values()]);
            }
            return;
          }

          const key = src.split("?")[0].split("#")[0];
          const area = width * height;
          const current = resolutionMap.get(key);

          if (!current || area > current.area) {
            resolutionMap.set(key, { src, width, height, area });
          }

          loadedCount++;
          if (loadedCount === rawImages.length) {
            displayGallery([...resolutionMap.values()]);
          }
        };

        img.onerror = () => {
          loadedCount++;
          if (loadedCount === rawImages.length) {
            displayGallery([...resolutionMap.values()]);
          }
        };
      });
    });
  });
});

// Individual image downloads
document.getElementById("downloadBtn").onclick = () => {
  const selected = document.querySelectorAll("input[type=checkbox]:checked");
  selected.forEach(input => {
    chrome.runtime.sendMessage({
      action: "downloadImage",
      url: input.value
    });
  });
};

// ZIP download with metadata
document.getElementById("zipBtn").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: "scanImages" }, (response) => {
      const selected = Array.from(document.querySelectorAll("input[type=checkbox]:checked"))
        .map(input => input.value);

      chrome.runtime.sendMessage({
        action: "downloadZip",
        urls: selected,
        postTitle: response.postTitle,
        subredditName: response.subredditName
      });
    });
  });
};
