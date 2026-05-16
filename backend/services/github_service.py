import asyncio
import httpx
import os

# Must be a public URL GitHub can POST to (not localhost). Override in backend/.env if needed.
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "https://gdg-hacks3.onrender.com")

# Limit parallel GitHub API calls (faster than one-by-one, avoids rate limits)
_WEBHOOK_CONCURRENCY = int(os.getenv("WEBHOOK_CONCURRENCY", "8"))


async def get_github_user(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {token}", "User-Agent": "productivity-island"},
        )
        res.raise_for_status()
        return res.json()


async def _fetch_all_repos(client: httpx.AsyncClient, token: str) -> list[str]:
    headers = {"Authorization": f"Bearer {token}", "User-Agent": "productivity-island"}
    names: list[str] = []
    page = 1
    while True:
        res = await client.get(
            f"https://api.github.com/user/repos?per_page=100&page={page}",
            headers=headers,
        )
        res.raise_for_status()
        repos = res.json()
        if not repos:
            break
        names.extend(r["full_name"] for r in repos)
        if len(repos) < 100:
            break
        page += 1
    return names


async def create_webhooks_for_user(token: str) -> int:
    sem = asyncio.Semaphore(_WEBHOOK_CONCURRENCY)
    async with httpx.AsyncClient(timeout=30.0) as client:
        repo_names = await _fetch_all_repos(client, token)

        async def sync_one(full_name: str) -> bool:
            async with sem:
                return await _create_webhook(client, token, full_name)

        results = await asyncio.gather(*[sync_one(name) for name in repo_names])
    return sum(1 for ok in results if ok)


def _is_our_webhook(hook_url: str) -> bool:
    if not hook_url:
        return False
    markers = ("/webhook/github", "gdg-hacks3", "productivity-island", "localhost:8000")
    return any(m in hook_url for m in markers)


async def _create_webhook(client: httpx.AsyncClient, token: str, full_name: str) -> bool:
    target_url = f"{WEBHOOK_URL.rstrip('/')}/webhook/github"
    headers = {"Authorization": f"Bearer {token}", "User-Agent": "productivity-island", "Content-Type": "application/json"}

    list_res = await client.get(f"https://api.github.com/repos/{full_name}/hooks", headers=headers)
    if list_res.status_code == 200:
        for hook in list_res.json():
            hook_url = hook.get("config", {}).get("url", "")
            if _is_our_webhook(hook_url):
                if hook_url == target_url:
                    return True
                patch = await client.patch(
                    f"https://api.github.com/repos/{full_name}/hooks/{hook['id']}",
                    headers=headers,
                    json={"active": True, "events": ["push"], "config": {"url": target_url, "content_type": "json"}},
                )
                return patch.status_code in (200, 201)

    res = await client.post(
        f"https://api.github.com/repos/{full_name}/hooks",
        headers=headers,
        json={"name": "web", "active": True, "events": ["push"], "config": {"url": target_url, "content_type": "json"}},
    )
    if res.status_code in (201, 422):
        return True
    print(f"Webhook create failed for {full_name}: {res.status_code} {res.text[:200]}")
    return False
