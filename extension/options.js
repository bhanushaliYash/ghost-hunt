/**
 * Stores the Ghost Hunt origin. If it is not localhost, Chrome asks
 * before the extension may call that host.
 */

const input = document.getElementById("origin");
const status = document.getElementById("status");

chrome.storage.sync.get({ origin: "http://localhost:3000" }, (stored) => {
  input.value = stored.origin;
});

document.getElementById("save").addEventListener("click", async () => {
  const origin = input.value.trim().replace(/\/$/, "");
  let url;
  try {
    url = new URL(origin);
  } catch {
    status.textContent = "Enter a full origin, such as http://localhost:3000.";
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    status.textContent = "Only http or https.";
    return;
  }
  const pattern = `${url.origin}/*`;
  const granted = await chrome.permissions.request({ origins: [pattern] });
  if (!granted) {
    status.textContent = "Permission was not granted.";
    return;
  }
  await chrome.storage.sync.set({ origin: url.origin });
  status.textContent = "Saved.";
});
