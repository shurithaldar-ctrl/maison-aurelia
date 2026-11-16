# Deploying Maison Aurelia

Upload this folder (or the zip's contents, with `app.py` at the top level) to a Python web host.

| Setting | Value |
|---|---|
| Build / install command | `pip install -r requirements.txt` |
| Start command | `gunicorn -k gthread -w 1 --threads 100 --timeout 120 -b 0.0.0.0:$PORT app:app` |
| Python | 3.11 or 3.12 |
| Port | the host's `$PORT` (the app listens on it through gunicorn) |

Environment variables (all optional): `CURRENCY` (default `$`), `TAX_PERCENT` (5), `RESERVATION_FEE` (10), `ANTHROPIC_API_KEY` (enables the live AI concierge; without it the built-in rules are used), `DB_PATH` (where `maison.db` is stored).

Notes
- Keep **one worker** (`-w 1`): live seat updates are kept in memory.
- SQLite is a file. On hosts with a temporary disk, bookings and reviews reset on every redeploy or restart. Mount a persistent disk and set `DB_PATH` to a path on it to keep them. For a demo this is fine.
- Payments are simulated; no payment keys are needed.
- Do not upload a `.env` file; set variables in the host's dashboard instead.
