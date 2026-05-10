import httpx
import os

WEBHOOK_URL = os.getenv("WEBHOOK_URL", "http://localhost:8000")


async def get_github_user(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {token}", "User-Agent": "productivity-island"},
        )
        res.raise_for_status()
        return res.json()


async def create_webhooks_for_user(token: str) -> int:
    created = 0
    page = 1
    async with httpx.AsyncClient() as client:
        while True:
            res = await client.get(
                f"https://api.github.com/user/repos?per_page=100&page={page}",
                headers={"Authorization": f"Bearer {token}", "User-Agent": "productivity-island"},
            )
            repos = res.json()
            if not repos:
                break
            for repo in repos:
                ok = await _create_webhook(client, token, repo["full_name"])
                if ok:
                    created += 1
            if len(repos) < 100:
                break
            page += 1
    return created


async def _create_webhook(client: httpx.AsyncClient, token: str, full_name: str) -> bool:
    res = await client.post(
        f"https://api.github.com/repos/{full_name}/hooks",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "productivity-island",
            "Content-Type": "application/json",
        },
        json={
            "name": "web",
            "active": True,
            "events": ["push"],
            "config": {
                "url": f"{WEBHOOK_URL}/webhook/github",
                "content_type": "json",
            },
        },
    )
    # 201 = created, 422 = already exists — both are fine
    return res.status_code in (201, 422)
