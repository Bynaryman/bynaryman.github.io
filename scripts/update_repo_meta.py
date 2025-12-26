import json
import os
import re
import urllib.request


def load_repo_list(path):
    repos = []
    in_repos = False
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            stripped = line.strip()
            if stripped.startswith("github_repos:"):
                in_repos = True
                continue
            if in_repos:
                if stripped and not line.startswith(" "):
                    break
                match = re.match(r"\s*-\s*(\S+)", line)
                if match:
                    repos.append(match.group(1))
    return repos


def fetch_repo(repo, token=None):
    url = f"https://api.github.com/repos/{repo}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "bynaryman-repo-meta",
            "Accept": "application/vnd.github+json",
        },
    )
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)
    return {
        "description": data.get("description") or "",
        "html_url": data.get("html_url") or "",
        "language": data.get("language") or "",
        "stargazers_count": data.get("stargazers_count", 0),
        "forks_count": data.get("forks_count", 0),
    }


def main():
    repo_list = load_repo_list(os.path.join("_data", "repositories.yml"))
    token = os.environ.get("GITHUB_TOKEN")
    meta = {}
    for repo in repo_list:
        try:
            meta[repo] = fetch_repo(repo, token=token)
        except Exception:
            meta[repo] = {
                "description": "",
                "html_url": f"https://github.com/{repo}",
                "language": "",
                "stargazers_count": 0,
                "forks_count": 0,
            }

    output_path = os.path.join("_data", "repo_meta.json")
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(meta, handle, ensure_ascii=True, indent=2, sort_keys=True)
        handle.write("\n")


if __name__ == "__main__":
    main()
