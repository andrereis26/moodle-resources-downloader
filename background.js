chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "PROCESS_LINKS") {
    for (const url of msg.links) {
      try {
        // Try faster method first (redirect)
        const redirectUrl = url + "&redirect=1";

        const res = await fetch(redirectUrl, {
          redirect: "follow"
        });

        const finalUrl = res.url;

        if (finalUrl.includes(".pdf")) {
          downloadFile(finalUrl);
          continue;
        }

        // Fallback: parse HTML
        const text = await res.text();

        // Generic Moodle PDF pattern
        const match = text.match(/\/pluginfile\.php\/[^"]+\.pdf/);

        if (match) {
          const pdfUrl = new URL(match[0], url).href;
          downloadFile(pdfUrl);
        }

      } catch (err) {
        console.error("Error processing:", url, err);
      }
    }
  }
});

function downloadFile(url) {
  chrome.downloads.download({
    url: url
  });
}