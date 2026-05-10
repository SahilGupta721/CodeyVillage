chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url?.includes("localhost:3000/auth/success")) return;

  const login = new URL(tab.url).searchParams.get("login");
  if (login) {
    chrome.storage.local.set({ githubConnected: true, githubLogin: login });
    chrome.tabs.remove(tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "activity") {
    handleActivity(message.payload);
    sendResponse({ ok: true });
  }
  return true;
});

const DEFAULT_SERVER_URL = "http://localhost:3000/track";

async function handleActivity(payload) {
  await saveToLog(payload);

  const { serverUrl } = await chrome.storage.sync.get("serverUrl");
  const url = serverUrl || DEFAULT_SERVER_URL;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const status = res.ok ? "success" : "error";
    await updateLogStatus(payload.timestamp, status, res.ok ? null : `HTTP ${res.status}`);
  } catch (err) {
    await updateLogStatus(payload.timestamp, "error", err.message);
  }
}

async function saveToLog(payload) {
  const { activityLog = [] } = await chrome.storage.local.get("activityLog");
  activityLog.unshift({ ...payload, status: "pending" });
  if (activityLog.length > 50) activityLog.pop();
  await chrome.storage.local.set({ activityLog });
}

async function updateLogStatus(timestamp, status, error = null) {
  const { activityLog = [] } = await chrome.storage.local.get("activityLog");
  const entry = activityLog.find((e) => e.timestamp === timestamp);
  if (entry) {
    entry.status = status;
    if (error) entry.error = error;
  }
  await chrome.storage.local.set({ activityLog });
}
