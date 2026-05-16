// Production Next.js app (sign-in + auth bridge). Keep in sync with Vercel.
const WEB_APP_URL = "https://codey-village-six.vercel.app";
const WEB_APP_URL_LOCAL = "http://localhost:3000";
const BACKEND_URL = "https://gdg-hacks3.onrender.com";

const COIN_VALUES = { leetcode_accepted: 50, github_commit: 25, job_application: 25 };

const COIN_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="vertical-align:-2px;display:inline-block"><rect x="4" y="1" width="6" height="1" fill="#fbbf24"/><rect x="2" y="2" width="10" height="1" fill="#fbbf24"/><rect x="1" y="3" width="12" height="8" fill="#fbbf24"/><rect x="2" y="11" width="10" height="1" fill="#fbbf24"/><rect x="4" y="12" width="6" height="1" fill="#fbbf24"/><rect x="4" y="2" width="4" height="1" fill="#fef9c3"/><rect x="2" y="3" width="2" height="4" fill="#fef9c3"/><rect x="2" y="3" width="1" height="1" fill="#fff"/><rect x="11" y="6" width="1" height="3" fill="#d97706"/><rect x="10" y="9" width="2" height="1" fill="#d97706"/><rect x="8" y="11" width="4" height="1" fill="#d97706"/></svg>';

const ENTRY_ICONS = {
  leetcode_accepted: "⚡",
  github_commit: "📦",
  job_application: "💼",
  purchase: "🛒",
};

function formatSlug(slug) {
  if (!slug) return "Problem";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatActivityType(type) {
  if (!type) return "Activity";
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function resolveEntryAmount(entry) {
  const type = entry.type || entry.activity_type;
  if (typeof entry.amount === "number") return entry.amount;
  if (type === "purchase") return -(entry.details?.price ?? entry.details?.amount ?? 0);
  return COIN_VALUES[type] ?? 0;
}

function formatCoinDelta(amount, { weekly = false } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return { text: "0", kind: "neutral", value: 0 };
  if (n > 0) {
    const text = weekly ? String(n) : `+${n}`;
    return { text, kind: "credited", value: n };
  }
  if (n < 0) {
    // Weekly card: show "5" + label "spent" — no "-" next to coin icon (reads as "+-5")
    const text = weekly ? String(Math.abs(n)) : `-${Math.abs(n)}`;
    return { text, kind: "deducted", value: n };
  }
  return { text: "0", kind: "neutral", value: 0 };
}

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch { }
}

async function init() {
  const { firebaseUid, firebaseUsername } = await chrome.storage.local.get([
    "firebaseUid",
    "firebaseUsername",
  ]);

  if (!firebaseUid) {
    renderLoginGate();
  } else {
    renderMain(firebaseUid, firebaseUsername);
  }
}

function renderLoginGate() {
  document.getElementById("auth-section").innerHTML = `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect width="64" height="64" rx="12" fill="#0d1117"/>
      <rect x="6"  y="6"  width="2" height="2" fill="#fff8c0"/>
      <rect x="52" y="8"  width="2" height="2" fill="#fff8c0"/>
      <rect x="30" y="4"  width="2" height="2" fill="#fff8c0"/>
      <rect x="8"  y="16" width="48" height="22" fill="#7c3aed"/>
      <rect x="8"  y="16" width="48" height="3"  fill="#9d5cf6"/>
      <rect x="8"  y="35" width="48" height="3"  fill="#5b21b6"/>
      <rect x="8"  y="34" width="16" height="20" fill="#7c3aed"/>
      <rect x="8"  y="34" width="3"  height="20" fill="#9d5cf6"/>
      <rect x="8"  y="52" width="16" height="2"  fill="#5b21b6"/>
      <rect x="40" y="34" width="16" height="20" fill="#7c3aed"/>
      <rect x="53" y="34" width="3"  height="20" fill="#5b21b6"/>
      <rect x="40" y="52" width="16" height="2"  fill="#5b21b6"/>
      <rect x="18" y="20" width="4"  height="4"  fill="#e2e8f0"/>
      <rect x="14" y="24" width="4"  height="4"  fill="#e2e8f0"/>
      <rect x="18" y="24" width="4"  height="4"  fill="#cbd5e1"/>
      <rect x="22" y="24" width="4"  height="4"  fill="#e2e8f0"/>
      <rect x="18" y="28" width="4"  height="4"  fill="#e2e8f0"/>
      <rect x="40" y="20" width="4"  height="4"  fill="#facc15"/>
      <rect x="36" y="24" width="4"  height="4"  fill="#60a5fa"/>
      <rect x="44" y="24" width="4"  height="4"  fill="#f87171"/>
      <rect x="40" y="28" width="4"  height="4"  fill="#4ade80"/>
      <rect x="27" y="26" width="4"  height="2"  fill="#a78bfa"/>
      <rect x="33" y="26" width="4"  height="2"  fill="#a78bfa"/>
      <rect x="12" y="39" width="8"  height="8"  fill="#4c1d95"/>
      <rect x="14" y="41" width="4"  height="4"  fill="#6d28d9"/>
      <rect x="44" y="39" width="8"  height="8"  fill="#4c1d95"/>
      <rect x="46" y="41" width="4"  height="4"  fill="#6d28d9"/>
    </svg>
    <div class="brand">Codey Village</div>
    <p class="auth-sub">Code. Earn coins. Beat your friends.</p>
    <p class="auth-hint">Already signed in on the site? Open the lobby tab, then reopen this popup.</p>
    <button id="loginBtn">Sign in with Google</button>
    <button id="loginLocalBtn" class="btn-secondary">Open lobby to sync</button>
  `;
  document.getElementById("loginBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: WEB_APP_URL + "/auth" });
  });
  document.getElementById("loginLocalBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: WEB_APP_URL_LOCAL + "/lobby" });
  });
}

async function renderMain(uid, username) {
  //const { coins: cachedCoins = 0 } = await chrome.storage.local.get("coins");

  document.getElementById("auth-section").innerHTML = `
    <div class="user-row">
      <span class="user-name">
        <svg width="16" height="16" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="display:inline;vertical-align:middle;margin-right:4px">
          <rect width="64" height="64" rx="12" fill="#0d1117"/>
          <rect x="8"  y="16" width="48" height="22" fill="#7c3aed"/>
          <rect x="8"  y="16" width="48" height="3"  fill="#9d5cf6"/>
          <rect x="8"  y="34" width="16" height="20" fill="#7c3aed"/>
          <rect x="40" y="34" width="16" height="20" fill="#7c3aed"/>
          <rect x="18" y="20" width="4"  height="4"  fill="#e2e8f0"/>
          <rect x="14" y="24" width="4"  height="4"  fill="#e2e8f0"/>
          <rect x="18" y="24" width="4"  height="4"  fill="#cbd5e1"/>
          <rect x="22" y="24" width="4"  height="4"  fill="#e2e8f0"/>
          <rect x="18" y="28" width="4"  height="4"  fill="#e2e8f0"/>
          <rect x="40" y="20" width="4"  height="4"  fill="#facc15"/>
          <rect x="36" y="24" width="4"  height="4"  fill="#60a5fa"/>
          <rect x="44" y="24" width="4"  height="4"  fill="#f87171"/>
          <rect x="40" y="28" width="4"  height="4"  fill="#4ade80"/>
        </svg>${username || "Player"}</span>
      <span class="coin-badge" id="coinCount">${COIN_SVG} …</span>
      <button id="signoutBtn">Sign out</button>
    </div>
  `;
  document.getElementById("main-section").style.display = "block";

  document.getElementById("signoutBtn").addEventListener("click", async () => {
    await chrome.storage.local.remove(["firebaseUid", "firebaseIdToken", "firebaseUsername", "coins", "githubUsername"]);
    window.location.reload();
  });

  renderQuickLaunch();
  await renderLog(uid);
  renderWeeklySummary(uid);
  renderLeaderboard(uid);

  const { githubUsername: cachedGithub } = await chrome.storage.local.get("githubUsername");
  const btn = document.getElementById("connectGithub");
  if (cachedGithub && btn) {
    btn.innerHTML = `<span class="gh-dot connected"></span>@${cachedGithub}`;
    btn.disabled = true;
    btn.classList.add("connected");
  } else if (btn) {
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      Connect GitHub`;
    btn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${WEB_APP_URL}/lobby` });
    });
  }

  fetchCoinsFromBackend(uid).then((coins) => {
    const el = document.getElementById("coinCount");
    if (el) {
      el.innerHTML = `${COIN_SVG} ${coins}`;
      el.classList.remove("coin-pop");
      void el.offsetWidth;
      el.classList.add("coin-pop");
    }
  });

  fetchGithubStatus(uid).then((githubLogin) => {
    const btn = document.getElementById("connectGithub");
    if (!btn || btn.disabled) return;
    if (githubLogin) {
      btn.innerHTML = `<span class="gh-dot connected"></span>@${githubLogin}`;
      btn.disabled = true;
      btn.classList.add("connected");
      chrome.storage.local.set({ githubUsername: githubLogin });
    }
  });
}

async function fetchCoinsFromBackend(uid) {
  try {
    const res = await fetch(`${BACKEND_URL}/coins/${uid}`);
    if (res.ok) {
      const data = await res.json();
      await chrome.storage.local.set({ coins: data.coins });
      return data.coins;
    }
  } catch { }
  const { coins = 0 } = await chrome.storage.local.get("coins");
  return coins;
}

async function fetchGithubStatus(uid) {
  try {
    const res = await fetch(`${BACKEND_URL}/users/${uid}`);
    if (res.ok) {
      const data = await res.json();
      return data.github_username || null;
    }
  } catch { }
  return null;
}

function renderQuickLaunch() {
  const el = document.getElementById("quick-launch");
  if (!el) return;
  el.innerHTML = `
    <div class="quick-launch">
      <button class="launch-btn" id="launchLeetcode">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.426.166-.185a5.896 5.896 0 0 0 1.24-3.736 5.916 5.916 0 0 0-1.2-3.564L13.5 2.025A1.456 1.456 0 0 0 13.483 0zm.02 3.011l4.73 7.897a3.91 3.91 0 0 1 .802 2.376 3.895 3.895 0 0 1-.822 2.474l-4.73-7.897 .02-4.85zM7.16 8.489l4.724 7.9-2.365 2.394a3.88 3.88 0 0 1-5.437.05L.805 15.64a3.926 3.926 0 0 1-.836-1.202 3.878 3.878 0 0 1-.041-2.914 3.93 3.93 0 0 1 .801-1.38L7.16 8.49z"/></svg>
        LeetCode
      </button>
      <button class="launch-btn" id="launchGithub">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        GitHub
      </button>
      <button class="launch-btn" id="launchVillage">
        <svg width="13" height="13" viewBox="0 0 64 64" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="16" width="48" height="22" fill="#7c3aed"/><rect x="8" y="34" width="16" height="20" fill="#7c3aed"/><rect x="40" y="34" width="16" height="20" fill="#7c3aed"/><rect x="18" y="20" width="4" height="4" fill="#e2e8f0"/><rect x="14" y="24" width="4" height="4" fill="#e2e8f0"/><rect x="18" y="24" width="4" height="4" fill="#cbd5e1"/><rect x="22" y="24" width="4" height="4" fill="#e2e8f0"/><rect x="18" y="28" width="4" height="4" fill="#e2e8f0"/><rect x="40" y="20" width="4" height="4" fill="#facc15"/><rect x="36" y="24" width="4" height="4" fill="#60a5fa"/><rect x="44" y="24" width="4" height="4" fill="#f87171"/><rect x="40" y="28" width="4" height="4" fill="#4ade80"/></svg>
        Village
      </button>
    </div>
  `;
  document.getElementById("launchLeetcode").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://leetcode.com" });
  });
  document.getElementById("launchGithub").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://github.com" });
  });
  document.getElementById("launchVillage").addEventListener("click", () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}/lobby` });
  });
}

async function renderWeeklySummary(uid) {
  const el = document.getElementById("weekly-summary");
  if (!el) return;
  try {
    const res = await fetch(`${BACKEND_URL}/coins/${uid}/weekly`);
    if (!res.ok) return;
    const { leetcode, commits, jobs, total_coins } = await res.json();
    const weekCoins = formatCoinDelta(total_coins, { weekly: true });
    el.innerHTML = `
      <div class="weekly-card">
        <div class="section-header">This Week</div>
        <div class="weekly-stats">
          <div class="stat-item">
            <span class="stat-icon">⚡</span>
            <span class="stat-val">${leetcode}</span>
            <span class="stat-label">solved</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📦</span>
            <span class="stat-val">${commits}</span>
            <span class="stat-label">commits</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💼</span>
            <span class="stat-val">${jobs}</span>
            <span class="stat-label">applied</span>
          </div>
          <div class="stat-item stat-coins" title="Net coins this week (earned minus spent)">
            <span class="stat-icon">🪙</span>
            <span class="stat-val stat-coins-${weekCoins.kind}">${weekCoins.text}</span>
            <span class="stat-label">${weekCoins.kind === "deducted" ? "coins spent" : weekCoins.kind === "credited" ? "coins earned" : "net"}</span>
          </div>
        </div>
      </div>
    `;
  } catch { }
}

async function renderLeaderboard(uid) {
  const el = document.getElementById("leaderboard");
  if (!el) return;
  try {
    const roomRes = await fetch(`${BACKEND_URL}/rooms/user/${uid}`);
    if (!roomRes.ok) return;
    const room = await roomRes.json();
    if (!room || !room.members || room.members.length < 2) return;

    const lbRes = await fetch(`${BACKEND_URL}/coins/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uids: room.members }),
    });
    if (!lbRes.ok) return;
    const standings = await lbRes.json();

    const medals = ["🥇", "🥈", "🥉"];
    const rows = standings.slice(0, 5).map((p, i) => {
      const isYou = p.uid === uid;
      return `
        <div class="lb-row${isYou ? " lb-you" : ""}">
          <span class="lb-rank">${medals[i] || `${i + 1}.`}</span>
          <span class="lb-name">${p.username}${isYou ? " (you)" : ""}</span>
          <span class="lb-coins">${COIN_SVG} ${p.coins}</span>
        </div>
      `;
    }).join("");

    el.innerHTML = `
      <div class="leaderboard-card">
        <div class="section-header">${room.name}</div>
        ${rows}
      </div>
    `;
  } catch { }
}

function buildEntryHTML(entry) {
  const type = entry.type || entry.activity_type;
  const amount = resolveEntryAmount(entry);
  const delta = formatCoinDelta(amount);
  const icon = ENTRY_ICONS[type] ?? (amount < 0 ? "🛒" : "🪙");
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let title = "";
  let sub = "";

  if (type === "leetcode_accepted") {
    title = formatSlug(entry.details?.problem_slug);
    const parts = [entry.details?.lang, entry.details?.runtime].filter(Boolean);
    sub = parts.join(" · ");
  } else if (type === "github_commit") {
    title = "GitHub Commit";
    sub = entry.details?.repo || entry.details?.repository || "";
  } else if (type === "job_application") {
    title = "Job Applied";
    const match = (entry.details?.url || "").match(/\/\/([^.]+)/);
    sub = match ? match[1] : "";
  } else if (type === "purchase" || amount < 0) {
    title = "Shop Purchase";
    sub = entry.details?.item || "";
  }

  if (!title) title = formatActivityType(type);

  return `
    <div class="entry">
      <span class="entry-icon">${icon}</span>
      <div class="entry-body">
        <span class="entry-title">${title}</span>
        ${sub ? `<span class="entry-sub">${sub}</span>` : ""}
      </div>
      <div class="entry-meta">
        <span class="entry-coins entry-coins-${delta.kind}">${delta.kind === "credited" ? `${COIN_SVG} ${delta.text}` : delta.text}</span>
        <span class="entry-time">${time}</span>
      </div>
    </div>
  `;
}

async function renderLog(uid) {
  const log = document.getElementById("log");
  if (!log) return;

  const { activityLog: localLog = [] } = await chrome.storage.local.get("activityLog");

  // Fetch backend ledger (includes webhook-triggered events like GitHub commits)
  let backendEntries = [];
  if (uid) {
    try {
      const res = await fetch(`${BACKEND_URL}/coins/${uid}/recent?limit=20`);
      if (res.ok) backendEntries = await res.json();
    } catch { }
  }

  // Normalise backend entries to same shape as local entries
  const backendNormalised = backendEntries.map((e) => ({
    type: e.activity_type,
    amount: e.amount,
    timestamp: e.timestamp,
    details: e.details || {},
    source: "backend",
  }));

  // Merge: deduplicate by type+timestamp (backend is authoritative)
  const localFiltered = localLog.filter((local) =>
    !backendNormalised.some((b) => b.type === local.type && Math.abs(new Date(b.timestamp) - new Date(local.timestamp)) < 5000)
  );

  const merged = [...backendNormalised, ...localFiltered]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 30);

  if (merged.length === 0) {
    log.innerHTML = '<p class="empty">No activity yet — solve a problem to start!</p>';
    return;
  }

  log.innerHTML = merged.map(buildEntryHTML).join("");
}

init();

let prevLogLength = 0;
chrome.storage.local.get("activityLog").then(({ activityLog = [] }) => {
  prevLogLength = activityLog.length;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if ("firebaseUid" in changes || "firebaseUsername" in changes) {
    window.location.reload();
    return;
  }
  if ("coins" in changes) {
    const el = document.getElementById("coinCount");
    if (el) {
      el.innerHTML = `${COIN_SVG} ${changes.coins.newValue ?? 0}`;
      el.classList.remove("coin-pop");
      void el.offsetWidth;
      el.classList.add("coin-pop");
    }
  }
  if ("activityLog" in changes) {
    const newLog = changes.activityLog.newValue ?? [];
    if (newLog.length > prevLogLength) {
      playDing();
      prevLogLength = newLog.length;
    }
    chrome.storage.local.get("firebaseUid").then(({ firebaseUid }) => renderLog(firebaseUid));
  }
});
