importScripts("libs/jszip.min.js");

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "PROCESS_LINKS") {
    const zip = new JSZip();
    const links = [...new Set(msg.links)];

    let count = 0;

    for (const url of links) {
      try {
        const pdfUrl = await getPdfUrl(url);

        if (!pdfUrl) {
          console.warn("Skipping (no PDF):", url);
          continue;
        }

        const blob = await fetchWithTimeout(pdfUrl, 15000);

        if (!blob) {
          console.warn("Skipping (timeout):", pdfUrl);
          continue;
        }

        const name = extractFileName(pdfUrl);
        zip.file(name, blob);

      } catch (err) {
        console.error("Error:", url, err);
      }

      count++;

      chrome.runtime.sendMessage({
        type: "PROGRESS",
        current: count,
        total: links.length
      });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });

    const reader = new FileReader();

    reader.onload = function () {
      chrome.downloads.download({
        url: reader.result,
        filename: "moodle_pdfs.zip"
      });
    };

    reader.readAsDataURL(zipBlob);

    chrome.runtime.sendMessage({ type: "DONE" });
  }
});


// Extract PDF URL
async function getPdfUrl(url) {
  try {
    const res = await fetch(url + "&redirect=1", {
      redirect: "follow",
      credentials: "include"
    });

    if (res.url.includes(".pdf")) {
      return res.url;
    }

    const text = await res.text();
    const match = text.match(/\/pluginfile\.php\/[^"]+\.pdf/);

    if (match) {
      return new URL(match[0], url).href;
    }

    return null;

  } catch (err) {
    console.error("Failed to resolve PDF:", url);
    return null;
  }
}


// Fetch with timeout
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      credentials: "include"
    });

    clearTimeout(id);

    if (!res.ok) return null;

    return await res.blob();

  } catch (err) {
    console.warn("Timeout or fetch failed:", url);
    return null;
  }
}


// 🏷️ Clean filename
function extractFileName(url) {
  return url.split("/").pop().split("?")[0];
}