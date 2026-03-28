document.getElementById("extract").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractLinks
  });
});

function extractLinks() {
  const links = Array.from(document.querySelectorAll("a.aalink"))
    .map(a => a.href)
    .filter(href => href.includes("/mod/resource/view.php"));

  chrome.runtime.sendMessage({ type: "PROCESS_LINKS", links });
}