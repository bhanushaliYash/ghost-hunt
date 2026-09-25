/**
 * Popup lookup. Scan this page does nothing until Confirm scan is clicked.
 * The API key never lives here. Only the site origin does.
 */

const q = document.getElementById("q");
const status = document.getElementById("status");
const card = document.getElementById("card");
const confirmBox = document.getElementById("confirm");

async function origin() {
  const stored = await chrome.storage.sync.get({ origin: "http://localhost:3000" });
  return String(stored.origin).replace(/\/$/, "");
}

async function score(value) {
  status.textContent = "Scoring…";
  card.hidden = true;
  const base = await origin();
  const response = await fetch(`${base}/api/lookup?q=${encodeURIComponent(value)}`);
  const body = await response.json();
  if (!response.ok) {
    status.textContent = body.error || "Lookup failed.";
    return;
  }
  status.textContent = body.sample ? "Includes a sample source." : "";
  card.hidden = false;
  document.getElementById("score-num").textContent = String(body.score.score);
  document.getElementById("confidence").textContent = `Confidence ${body.score.confidence}`;
  const dissent = body.score.disagreements[0];
  const top = body.hits.find((hit) => hit.malicious === true) || body.hits[0];
  document.getElementById("summary").textContent = dissent || top?.summary || body.type;
}

document.getElementById("score").addEventListener("click", () => {
  if (q.value.trim()) score(q.value.trim());
});

document.getElementById("scan").addEventListener("click", async () => {
  confirmBox.hidden = false;
});

document.getElementById("confirm-btn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    status.textContent = "This tab has no URL to score.";
    return;
  }
  q.value = tab.url;
  confirmBox.hidden = true;
  score(tab.url);
});
