# Mini Galaga

Mini Galaga is a Canvas-based 2D shooter. It is split into a browser frontend and a FastAPI backend for score storage.

## Project Structure

- `frontend/index.html`: Game UI, HUD, overlay, and canvas structure
- `frontend/style.css`: Layout, HUD, overlay, and canvas styling
- `frontend/state.js`: Global state, DOM references, achievement definitions, and HUD updates
- `frontend/logic.js`: Game flow, collision handling, score calculation, stage/level progression, and score submission
- `frontend/render.js`: Rendering for the player, enemies, boss, bullets, and effects
- `frontend/game.js`: Input wiring and initial bootstrapping
- `backend/app.py`: FastAPI score API
- `backend/requirements.txt`: Backend dependencies
- `backend/scores.db`: SQLite data file, created automatically on first run

## Current Status

- The game runs directly in the browser.
- When a run ends or is cleared, the score is submitted to `http://127.0.0.1:8000/scores`.
- If the backend is running, the score is stored in SQLite.
- If the backend is not running, the game still works normally.

## Frontend Run Instructions

1. Open `frontend/index.html` in a browser.
2. Click the start button to begin the game.

If you prefer a local server, use something like VS Code Live Server.

## Backend Run Instructions

1. Change into the `backend` folder.
2. Run `pip install -r requirements.txt` to install dependencies.
3. Start the server with `uvicorn app:app --reload --host 0.0.0.0 --port 8000`.
4. If you want to check it, call `http://127.0.0.1:8000/health`.

## Controls

- `A` or `Left Arrow`: Move left
- `D` or `Right Arrow`: Move right
- `Space`: Shoot
- Start button: Start or restart the game

## Game Features

- HUD for score, stage, level, and lives
- Three stages with three levels each
- Final boss at Stage 3, Level 3
- `Rapid`, `Spread`, and `Shield` power-ups
- Achievements are tracked per run

## Score API

### `POST /scores`
Stores a score.

Example payload:

```json
{
  "player_name": "Anonymous",
  "score": 1200,
  "stage": 3,
  "level": 2
}
```

### `GET /scores`
Returns stored scores.

Query parameters:
- `limit`: default 50, max 200
- `offset`: default 0

### `GET /scores/top`
Returns the top scores.

Query parameters:
- `limit`: default 10, max 50

### `GET /health`
Returns server status.

## Development Notes

- SQLite is created at `backend/scores.db`.
- CORS is open for local frontend calls.
- Score submission failures do not block gameplay.
