
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "activity") {
    handleActivity(message.payload);
    sendResponse({ ok: true });
  }

  if (message.type === "firebase_auth") {
    chrome.storage.local.set({
      firebaseUid: message.uid,
      firebaseIdToken: message.idToken,
      firebaseUsername: message.username || null,
    });
    sendResponse({ ok: true });
  }

  if (message.type === "firebase_signout") {
    chrome.storage.local.remove(["firebaseUid", "firebaseIdToken", "firebaseUsername"]);
    sendResponse({ ok: true });
  }

  return true;
});

const DEFAULT_SERVER_URL = "http://localhost:3000/track";
const BACKEND_URL = "http://localhost:8000";

const COIN_VALUES = {
  leetcode_accepted: 10,
  github_commit: 5,
  job_application: 15,
};

async function handleActivity(payload) {
  const { firebaseUid } = await chrome.storage.local.get("firebaseUid");
  const enrichedPayload = { ...payload, uid: firebaseUid || null };

  await saveToLog(enrichedPayload);

  const { serverUrl } = await chrome.storage.sync.get("serverUrl");
  const url = serverUrl || DEFAULT_SERVER_URL;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedPayload),
    });
    const status = res.ok ? "success" : "error";
    await updateLogStatus(payload.timestamp, status, res.ok ? null : `HTTP ${res.status}`);
    if (res.ok && firebaseUid) await creditCoinsToBackend(firebaseUid, payload.type);
  } catch (err) {
    await updateLogStatus(payload.timestamp, "error", err.message);
  }
}

async function creditCoinsToBackend(uid, activityType) {
  const amount = COIN_VALUES[activityType] ?? 0;
  if (amount === 0) return;
  try {
    const res = await fetch(`${BACKEND_URL}/coins/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, activity_type: activityType, amount }),
    });
    if (res.ok) {
      const { coins } = await res.json();
      await chrome.storage.local.set({ coins });
    }
  } catch {
    // backend unavailable — update local count as fallback
    const { coins = 0 } = await chrome.storage.local.get("coins");
    await chrome.storage.local.set({ coins: coins + amount });
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
