
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "activity") {
    handleActivity(message.payload);
    sendResponse({ ok: true });
  }

  if (message.type === "firebase_auth") {
    const { uid, idToken, username } = message;
    chrome.storage.local.set({
      firebaseUid: uid,
      firebaseIdToken: idToken,
      firebaseUsername: username || null,
    });
    if (uid && username) {
      fetch(`${BACKEND_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, username }),
      }).catch(() => { });
    }
    sendResponse({ ok: true });
  }

  if (message.type === "firebase_signout") {
    chrome.storage.local.remove(["firebaseUid", "firebaseIdToken", "firebaseUsername", "coins", "githubUsername"]);
    sendResponse({ ok: true });
  }

  if (message.type === "github_connected") {
    chrome.storage.local.set({ githubUsername: message.githubUsername });
    sendResponse({ ok: true });
  }

  return true;
});

const DEFAULT_SERVER_URL = "https://gdg-hacks3.onrender.com/track";
const BACKEND_URL = "https://gdg-hacks3.onrender.com";

const COIN_VALUES = {
  leetcode_accepted: 50,
  github_commit: 25,
  job_application: 25,
};

function getDedupKey(activityType, details) {
  if (activityType === "leetcode_accepted") return details?.problem_slug || null;
  if (activityType === "job_application") return details?.url || null;
  return null;
}

function getToastTitle(type, details) {
  if (type === "leetcode_accepted") {
    const slug = details?.problem_slug || "";
    return slug ? slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ") : "Problem Solved";
  }
  if (type === "github_commit") return "GitHub Commit";
  if (type === "job_application") return "Job Applied";
  return type;
}

async function handleActivity(payload) {
  const { firebaseUid } = await chrome.storage.local.get("firebaseUid");
  const enrichedPayload = { ...payload, uid: firebaseUid || null };

  await saveToLog(enrichedPayload);

  // Credit coins immediately, independent of Express server
  if (firebaseUid) await creditCoinsToBackend(firebaseUid, payload.type, payload.details);

  // Show toast on active tab
  const coins = COIN_VALUES[payload.type] ?? 0;
  if (coins > 0) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "show_toast",
          activityType: payload.type,
          title: getToastTitle(payload.type, payload.details),
          coins,
        });
      }
    } catch { }
  }

  // Fire-and-forget to Express tracking server
  const { serverUrl } = await chrome.storage.sync.get("serverUrl");
  const url = serverUrl || DEFAULT_SERVER_URL;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enrichedPayload),
  })
    .then(async (res) => {
      const status = res.ok ? "success" : "error";
      await updateLogStatus(payload.timestamp, status, res.ok ? null : `HTTP ${res.status}`);
    })
    .catch(async (err) => {
      await updateLogStatus(payload.timestamp, "error", err.message);
    });
}

async function creditCoinsToBackend(uid, activityType, details) {
  const amount = COIN_VALUES[activityType] ?? 0;
  if (amount === 0) return;
  const dedup_key = getDedupKey(activityType, details);
  try {
    const res = await fetch(`${BACKEND_URL}/coins/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, activity_type: activityType, amount, dedup_key }),
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.duplicate) {
        await chrome.storage.local.set({ coins: data.coins });
      }
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
