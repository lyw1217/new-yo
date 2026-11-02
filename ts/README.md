# NEW-YO — TypeScript + Hono

루트의 Gin 서비스를 Node 22 + Hono로 옮긴 버전입니다. 모든 기능은 scraping-news-go("scraper")로 요청을 넘기고, 받은 응답을 카카오톡 봇에 맞는 형태로 바꿔 돌려줍니다.

> ⚠️ 2026-11-02 기준 scraper 컨테이너(`lyw1217/scrapingnewsgo:0.13`)는 9개월 전부터 멈춰 있고, `lunchtoday.site`도 DNS에서 조회되지 않습니다. 그래서 `/` 외의 모든 엔드포인트가 Go 버전과 똑같이 500/404를 돌려줍니다. scraper를 다시 띄우면 `SCRAPER_URL`만 바꿔서 붙일 수 있습니다.

```bash
npm ci
npm test
npm run typecheck
PORT=30100 SCRAPER_URL=http://localhost:30200 npm run dev
docker buildx build --platform linux/amd64 -t lyw1217/newyo:ts .
```

| 이름 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `30100` (이미지) | 필수. 비어 있으면 Go 버전처럼 바로 종료 |
| `SCRAPER_URL` | `http://lunchtoday.site:30200` | Go에서는 상수였음 |
| `TZ` | `Asia/Seoul` | |

기능 대조표는 [PARITY.md](PARITY.md)에 있습니다.
