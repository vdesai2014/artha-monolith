# artha.bot

ML Robotics Platform - Visualize robot arm training data.

## Quick Start

```bash
# Run tests
pip install -r backend/requirements.txt pytest httpx
pytest tests/ -v

# Run locally
cd frontend && npm install && npm run build && cd ..
uvicorn backend.main:app --reload
```

## Deploy to Fly.io

```bash
# First time setup
fly launch

# Get deploy token for GitHub Actions
fly tokens create deploy -x 999999h
# Add as FLY_API_TOKEN secret in GitHub repo settings

# Push to main branch -> auto deploys
git push origin main
```

## Structure

```
artha-monolith/
├── backend/          # FastAPI
│   ├── main.py
│   └── requirements.txt
├── frontend/         # Vite + TypeScript
│   ├── src/main.ts
│   └── index.html
├── tests/            # pytest
├── Dockerfile        # Multi-stage build
├── fly.toml          # Fly.io config
└── .github/workflows/deploy.yml
```
