const statusEl = document.getElementById("status");

document.getElementById("extract").addEventListener("click", async () => {
  statusEl.textContent = "Collecting links...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "PROGRESS") {
      statusEl.textContent = `Downloading ${msg.current} / ${msg.total}`;
    }

    if (msg.type === "DONE") {
      statusEl.textContent = "✅ Done!";
    }
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractLinks
  });
});

function extractLinks() {
  const links = Array.from(document.querySelectorAll("a"))
    .map(a => a.href)
    .filter(href => href.includes("/mod/resource/view.php"));

  chrome.runtime.sendMessage({ type: "PROCESS_LINKS", links });
}