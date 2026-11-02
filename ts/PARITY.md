# Go → TypeScript 기능 대조표 (newyo)

기준: 루트 Go 코드 (HEAD fa98f31). NAS `/volume1/docker/new-yo` 배포본과 md5가 일치합니다.
✅ 동일 · 🔧 동작은 같고 버그만 수정 · ➖ 의도적으로 뺌

| Go (Gin) | TS (Hono) | 상태 | 테스트 |
|---|---|---|---|
| `GET /` → `Hello NEW-YO!` | 같음 | ✅ | `GET / greets` |
| NoRoute → `{"status":"404","reason":"Not Found"}` (status가 문자열) | 같음 | ✅ | `unknown path…` |
| `GET /article?paper=hankyung\|maekyung\|quicknews` → scraper `/article`, `{status:"success",contents:[{paper,content}]}` | 같음, 신문 제목 문자열도 같음 | ✅ | `/article?paper=X…` |
| `paper` 없음/그 외 값 → 세 신문 순서대로 | 같음 | ✅ | `/article without paper…` |
| `auth`가 있을 때만 scraper로 넘김 | 같음 | ✅ | 같음 |
| scraper가 200이 아니면 → 같은 상태코드 + `{status, reason: contents}` | 같음 | ✅ | `passes through scraper errors` |
| scraper 연결 실패 → nil 역참조 panic → 500 빈 본문 | 500 `{"status":"fail","reason":"Internal Server Error"}` | 🔧 | 같음 |
| scraper JSON 파싱 실패 → `content:""`로 성공 처리 | 500 fail | 🔧 | — |
| `GET /weather?k1..k3&p=` → scraper `/weather`, `@`로 구분한 단기예보 문자열 | 같음 (줄 구성·공백 패딩·조건부 강수량/적설 포함) | ✅ | `/weather short-term…`, `formatForecast…` |
| `p` 검증: 없음/`>1` → "Query p is invalid.", 정수 아님 → "Query p is not integer." | 같음 | ✅ | `validates p` |
| 비어 있지 않은 키워드만 `k1,k2…`로 다시 번호 매김 | 같음 | ✅ | `/weather short-term…` |
| scraper가 200이 아니면 404, 예보 항목 12개 미만이면 panic → 500 | 404 / 500 JSON | ✅/🔧 | `upstream failures` |
| `GET /weather?mid=` → `*`·`○`로 나누고 첫 조각은 `-`로 나눈 뒤 `@○`로 합침 | 같음 | ✅ | `/weather?mid=…` |
| 쿼리 없음 → 400 `{"status":400,"reason":"Bad Request"}` | 같음 | ✅ | `no query is 400` |
| `GET /romanization?query=` → `"X을(를) 현행 로마자 표기법으로 바꾸면 Y"` | 같음. 결과가 비면 500 (Go는 panic) | ✅/🔧 | `/romanization` |
| `GET /papago?text=` → scraper `POST /papago?text&auth` → 텍스트 | 같음 | ✅ | `/papago forwards…` |
| 업스트림 타임아웃 없음 | 10초 | 🔧 | — |
| `SCRAPER_URL` 상수 | 환경변수 (기본값은 그대로) | 🔧 | — |
| logrus + lumberjack 파일 로그 (`log/<host>_newyo.log`) | stdout | ➖ |
| `GIN_MODE=debug`, root 실행, Alpine 3.15, `sleep infinity` | `node:22.23.4-bookworm-slim`, `USER node`, npm 제거, HEALTHCHECK, SIGTERM 시 종료 | 🔧 |
| `messengerbot/*.js` | 변경 없음 | — 서버 코드가 아님 (휴대폰의 메신저봇 앱에서 실행됨) |

스케줄러, 저장소, TLS는 Go 버전에도 없었습니다. 뉴스 발송 스케줄(카카오 나에게 보내기)은 scraper 쪽 기능이라 이번 범위 밖입니다.

Trivy 0.69.1 (HIGH/CRITICAL): 수정 가능한 취약점 0건. Debian 12.15 기본 패키지에 수정판이 아직 없는 33건이 남아 있습니다.
