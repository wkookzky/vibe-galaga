from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "scores.db"
DEFAULT_PLAYER_NAME = "Anonymous"


class ScoreCreate(BaseModel):
    player_name: str = Field(default=DEFAULT_PLAYER_NAME, max_length=32)
    score: int = Field(ge=0)
    stage: int = Field(ge=1)
    level: int = Field(ge=1)


class ScoreRow(BaseModel):
    id: int
    player_name: str
    score: int
    stage: int
    level: int
    created_at: str


class ScoreListResponse(BaseModel):
    items: list[ScoreRow]


class HealthResponse(BaseModel):
    status: str
    db_path: str


class ScoreCreateResponse(BaseModel):
    message: str
    score: ScoreRow


def connect_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL CHECK(score >= 0),
                stage INTEGER NOT NULL CHECK(stage >= 1),
                level INTEGER NOT NULL CHECK(level >= 1),
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC, created_at DESC)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC)")
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Mini Galaga Score API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = connect_db()
    try:
        yield conn
    finally:
        conn.close()


def row_to_score(row: sqlite3.Row) -> ScoreRow:
    return ScoreRow(
        id=row["id"],
        player_name=row["player_name"],
        score=row["score"],
        stage=row["stage"],
        level=row["level"],
        created_at=row["created_at"],
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", db_path=str(DB_PATH))


@app.post("/scores", response_model=ScoreCreateResponse, status_code=201)
def create_score(payload: ScoreCreate, db: sqlite3.Connection = Depends(get_db)) -> ScoreCreateResponse:
    player_name = payload.player_name.strip() or DEFAULT_PLAYER_NAME

    cursor = db.execute(
        """
        INSERT INTO scores (player_name, score, stage, level)
        VALUES (?, ?, ?, ?)
        """,
        (player_name, payload.score, payload.stage, payload.level),
    )
    db.commit()

    row = db.execute(
        """
        SELECT id, player_name, score, stage, level, created_at
        FROM scores
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=500, detail="Failed to persist score")

    return ScoreCreateResponse(message="Score saved", score=row_to_score(row))


@app.get("/scores", response_model=ScoreListResponse)
def list_scores(
    db: sqlite3.Connection = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ScoreListResponse:
    rows = db.execute(
        """
        SELECT id, player_name, score, stage, level, created_at
        FROM scores
        ORDER BY score DESC, created_at DESC, id DESC
        LIMIT ? OFFSET ?
        """,
        (limit, offset),
    ).fetchall()
    return ScoreListResponse(items=[row_to_score(row) for row in rows])


@app.get("/scores/top", response_model=ScoreListResponse)
def top_scores(
    db: sqlite3.Connection = Depends(get_db),
    limit: int = Query(default=10, ge=1, le=50),
) -> ScoreListResponse:
    rows = db.execute(
        """
        SELECT id, player_name, score, stage, level, created_at
        FROM scores
        ORDER BY score DESC, created_at DESC, id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return ScoreListResponse(items=[row_to_score(row) for row in rows])
