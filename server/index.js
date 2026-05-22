import express from "express";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  WEBHOOK_URL,
  PORT = 3000,
} = process.env;

// In-memory store: userId → { token, login }
const users = new Map();
// In-memory activity log
const activityLog = [];

// --- OAuth ---

app.get("/auth/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: "repo",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token, error } = await tokenRes.json();
  if (error || !access_token) return res.status(400).send("OAuth failed: " + error);

  // Get user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${access_token}`, "User-Agent": "cs-tracker" },
  });
  const user = await userRes.json();
  users.set(user.id, { token: access_token, login: user.login });

  // Create webhooks on all repos
  await createWebhooksForUser(access_token, user.login);

  res.redirect(`https://gdg-hacks3.onrender.com/auth/success?login=${user.login}`);
});

async function createWebhooksForUser(token, login) {
  let page = 1;
  while (true) {
    const res = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "cs-tracker" },
    });
    if (!res.ok) {
      console.error(`GitHub repos API error: ${res.status}`);
      break;
    }
    const repos = await res.json();
    if (!repos.length) break;

    await Promise.all(repos.map((repo) => createWebhook(token, repo.full_name)));
    if (repos.length < 100) break;
    page++;
  }
  console.log(`Webhooks created for ${login}`);
}

async function createWebhook(token, fullName) {
  const res = await fetch(`https://api.github.com/repos/${fullName}/hooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "cs-tracker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url: `${WEBHOOK_URL}/webhook/github`,
        content_type: "json",
      },
    }),
  });
  // 201 = created, 422 = already exists — both are fine
  if (res.status !== 201 && res.status !== 422) {
    console.error(`Webhook creation failed for ${fullName}: ${res.status}`);
  }
}

// --- Auth success page ---

app.get("/auth/success", (req, res) => {
  const { login } = req.query;
  const safeLogin = String(login || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  res.send(`
    <html><body>
      <p>GitHub connected as <strong>${safeLogin}</strong>! You can close this tab.</p>
      <script>window.close()</script>
    </body></html>
  `);
});

// --- Webhook receiver ---

app.post("/webhook/github", (req, res) => {
  const event = req.headers["x-github-event"];
  if (event !== "push") return res.sendStatus(200);

  const { repository, commits, pusher } = req.body;
  commits.forEach((commit) => {
    const entry = {
      type: "github_commit",
      source: "github",
      timestamp: new Date().toISOString(),
      details: {
        repo: repository.full_name,
        commit_sha: commit.id,
        commit_message: commit.message,
        author: commit.author?.name ?? "unknown",
      },
    };
    activityLog.unshift(entry);
    console.log("GitHub commit:", entry.details);
  });

  res.sendStatus(200);
});

// --- Extension tracker endpoint ---

app.post("/track", (req, res) => {
  const entry = { ...req.body, receivedAt: new Date().toISOString() };
  activityLog.unshift(entry);
  console.log("Activity tracked:", entry);
  res.sendStatus(200);
});

// --- View log ---

app.get("/log", (req, res) => res.json(activityLog));

app.listen(PORT, () => console.log(`CS Tracker server running on http://localhost:${PORT}`));
