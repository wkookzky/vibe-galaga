# Mini Galaga

Mini Galaga는 Canvas 기반의 2D 슈팅 게임입니다. 프론트엔드와 점수 저장용 FastAPI 백엔드로 구성되어 있습니다.

## 프로젝트 구조

- `frontend/index.html`: 게임 화면, HUD, 오버레이, 캔버스 구조
- `frontend/style.css`: 전체 레이아웃, HUD, 오버레이, 캔버스 스타일
- `frontend/state.js`: 전역 상태, DOM 참조, 업적 정의, HUD 갱신 로직
- `frontend/logic.js`: 게임 진행, 충돌 판정, 점수 계산, 스테이지/레벨 전환, 점수 전송
- `frontend/render.js`: 플레이어, 적, 보스, 탄환, 이펙트 렌더링
- `frontend/game.js`: 키 입력 처리와 초기 실행
- `backend/app.py`: FastAPI 점수 저장 API
- `backend/requirements.txt`: 백엔드 의존성 목록
- `backend/scores.db`: SQLite 데이터 파일. 첫 실행 시 자동 생성됨

## 현재 상태

- 프론트엔드만으로 게임은 바로 실행됩니다.
- 게임 종료 또는 클리어 시 점수가 `http://127.0.0.1:8000/scores`로 전송됩니다.
- 백엔드가 실행 중이면 SQLite에 점수가 저장됩니다.
- 백엔드가 실행되지 않아도 게임은 정상 동작합니다.

## 프론트엔드 실행 방법

1. `frontend/index.html`을 브라우저에서 엽니다.
2. 시작 버튼을 눌러 게임을 시작합니다.

로컬 서버를 사용하고 싶다면 VS Code Live Server 같은 정적 서버를 사용하면 됩니다.

## 백엔드 실행 방법

1. 터미널에서 `backend` 폴더로 이동합니다.
2. `pip install -r requirements.txt`를 실행해 의존성을 설치합니다.
3. `uvicorn app:app --reload --host 0.0.0.0 --port 8000`로 서버를 실행합니다.
4. 확인이 필요하면 `http://127.0.0.1:8000/health`를 호출합니다.

## 조작 방법

- `A` 또는 `Left Arrow`: 왼쪽 이동
- `D` 또는 `Right Arrow`: 오른쪽 이동
- `Space`: 발사
- 시작 버튼: 게임 시작 / 재시작

## 게임 특징

- 점수, 스테이지, 레벨, 목숨을 보여주는 HUD
- 총 3개의 스테이지와 3개의 레벨
- Stage 3, Level 3에서 보스 등장
- `Rapid`, `Spread`, `Shield` 파워업
- 업적은 한 번의 플레이 세션 기준으로 집계

## 점수 API

### `POST /scores`
점수를 저장합니다.

요청 예시:

```json
{
  "player_name": "Anonymous",
  "score": 1200,
  "stage": 3,
  "level": 2
}
```

### `GET /scores`
저장된 점수 목록을 조회합니다.

쿼리 파라미터:
- `limit`: 기본 50, 최대 200
- `offset`: 기본 0

### `GET /scores/top`
상위 점수 목록을 조회합니다.

쿼리 파라미터:
- `limit`: 기본 10, 최대 50

### `GET /health`
서버 상태를 확인합니다.

## 개발 메모

- SQLite는 `backend/scores.db`에 생성됩니다.
- CORS는 로컬 프론트엔드 호출을 허용하도록 열려 있습니다.
- 점수 전송 실패는 게임 진행을 막지 않습니다.
