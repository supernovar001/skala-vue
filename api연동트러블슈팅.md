v2와 v1의 다른점
- vercel 배포 시 항공 기상청 API만 연동이 되지않아
- 코드를 수정하였습니다.

```
skala-vue/
├── api/
│   └── kma.js        ← 새로 생성
├── src/
├── package.json
├── vite.config.js
└── vercel.json
```
```git add api/kma.js (신규생성)
git add src/components/exercise/WeatherMetar.vue (API 키 변경)
변경 범위 : 변경 범위는 KMA_AUTH_KEY 제거 + METAR axios 변경 + SIGMET axios 변경

수정 전
```
WeatherMetar.vue
       │
       │ VITE_KMA_AUTH_KEY
       ▼
 /kma-api
       │
       ▼
기상청 API  (연동 실패)

```
┌──────────────────────┐
│ 브라우저             │
│ WeatherMetar.vue     │
└──────────┬───────────┘
           │
           │ /api/kma?type=metar&icao=RKSI
           ▼
┌──────────────────────┐
│ Vercel Function      │
│ api/kma.js           │
│                     │
│ process.env.         │
│ KMA_AUTH_KEY 🔐      │
└──────────┬───────────┘
           │
           │ authKey 포함
           ▼
┌──────────────────────┐
│ 기상청 API Hub       │
│ getMetar             │
└──────────────────────┘
```


지금 상태면 원인이 거의 확정됐어.

**문제는 이거야:**

```js
const KMA_AUTH_KEY = import.meta.env.VITE_KMA_AUTH_KEY
```

그런데 Vercel에는 지금:

```text
KMA_AUTH_KEY   ← Secret
```

으로 등록돼 있지?

그러면 브라우저에서 실행되는 Vue 코드는 `KMA_AUTH_KEY`를 읽을 수 없어. Vite는 기본적으로 `VITE_` 접두사가 붙은 값만 `import.meta.env`로 클라이언트에 노출하고, 그 값은 최종 번들에도 포함된다. 그래서 Vercel이 민감한 값에 `VITE_`를 쓰지 말라고 경고하는 방향이 맞다. ([vitejs][1])

지금 네 화면의:

```text
401 Unauthorized
```

도 이 상황과 정확히 맞아.

```text
WeatherMetar.vue
↓
KMA_AUTH_KEY = undefined
↓
axios 요청에서 authKey가 없거나 잘못 전달
↓
Vercel Proxy
↓
기상청 METAR
↓
401 "유효한 인증키가 아닙니다"
```
### 자세한 내용 (by GPT)
그래서 이제 **`VITE_KMA_AUTH_KEY`를 억지로 Config로 넣으려고 하지 말고**, 지금 등록한 `KMA_AUTH_KEY` Secret을 그대로 유지하면서 **Vercel Function에서 기상청을 호출하는 방식**으로 바꾸는 게 맞아. Vercel은 Vite 프로젝트에서도 프로젝트 루트의 `api/` 디렉터리에 서버 함수를 만들 수 있다. ([Vercel][2])

## 1. 프로젝트 루트에 `api/kma.js` 생성

구조:

```text
skala-vue/
├── api/
│   └── kma.js        ← 새로 생성
├── src/
├── package.json
├── vite.config.js
└── vercel.json
```

`api/kma.js`:

```js
export default async function handler(request, response) {
  try {
    const { type = 'metar', icao } = request.query

    const authKey = process.env.KMA_AUTH_KEY

    if (!authKey) {
      return response.status(500).json({
        message: 'KMA_AUTH_KEY 환경변수가 설정되지 않았습니다.',
      })
    }

    const endpoint =
      type === 'sigmet'
        ? 'getSigmet'
        : 'getMetar'

    const params = new URLSearchParams({
      pageNo: '1',
      numOfRows: '10',
      dataType: 'XML',
      authKey,
    })

    if (type === 'metar' && icao) {
      params.set('icao', icao)
    }

    const url =
      `https://apihub.kma.go.kr/api/typ02/openApi/` +
      `AmmIwxxmService/${endpoint}?${params.toString()}`

    const kmaResponse = await fetch(url)
    const text = await kmaResponse.text()

    response.status(kmaResponse.status)
    response.setHeader(
      'Content-Type',
      kmaResponse.headers.get('content-type') ||
        'application/xml; charset=utf-8',
    )

    return response.send(text)
  } catch (error) {
    console.error('KMA proxy error:', error)

    return response.status(500).json({
      message: 'KMA API 요청 중 오류가 발생했습니다.',
    })
  }
}
```

여기서 중요한 건:

```js
process.env.KMA_AUTH_KEY
```

야.

이 코드는 **Vercel 서버에서 실행**되기 때문에 네 Secret 값을 읽을 수 있어.

---

## 2. `WeatherMetar.vue`에서 이 줄 삭제

현재:

```js
const KMA_AUTH_KEY = import.meta.env.VITE_KMA_AUTH_KEY
```

이걸 **삭제**해.

이제 브라우저는 API Key를 알 필요가 없어.

---

## 3. METAR 호출 코드 변경

현재:

```js
const res = await axios.get(
  '/kma-api/api/typ02/openApi/AmmIwxxmService/getMetar',
  {
    responseType: 'text',
    params: {
      pageNo: 1,
      numOfRows: 10,
      dataType: 'XML',
      icao: airport.id,
      authKey: KMA_AUTH_KEY,
    },
  },
)
```

이걸:

```js
const res = await axios.get('/api/kma', {
  responseType: 'text',
  params: {
    type: 'metar',
    icao: airport.id,
  },
})
```

로 바꿔.

훨씬 단순해져.

흐름은 이제:

```text
WeatherMetar.vue
     ↓
GET /api/kma?type=metar&icao=RKSI
     ↓
Vercel Function
     ↓
process.env.KMA_AUTH_KEY
     ↓
기상청 getMetar
     ↓
XML
```

이렇게 된다.

---

## 4. SIGMET도 변경

현재:

```js
const res = await axios.get(
  '/kma-api/api/typ02/openApi/AmmIwxxmService/getSigmet',
  {
    responseType: 'text',
    params: {
      pageNo: 1,
      numOfRows: 10,
      dataType: 'XML',
      authKey: KMA_AUTH_KEY,
    },
  },
)
```

를:

```js
const res = await axios.get('/api/kma', {
  responseType: 'text',
  params: {
    type: 'sigmet',
  },
})
```

로 변경.

다만 **SIGMET은 네 계정에서 활용신청이 안 되어 있었다면 서버 구조를 고쳐도 403이 나오는 게 정상**이야.

즉:

```text
METAR
→ 승인됨
→ 정상 동작해야 함

SIGMET
→ 별도 활용신청 미승인
→ 403 예상
```

둘을 분리해서 봐야 해.

---

## 5. `vercel.json`도 변경

이제 `/kma-api` 외부 Rewrite는 필요 없어.

기존:

```json
{
  "rewrites": [
    {
      "source": "/kma-api/:path*",
      "destination": "https://apihub.kma.go.kr/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

에서 `/kma-api` 부분을 없애.

그리고 `/api`는 Vercel Function이 처리해야 하므로 SPA catch-all에서 제외하는 게 안전해.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

Vercel의 SPA에서는 `index.html` fallback rewrite가 필요하고, API Route는 별도 Function으로 둘 수 있다. ([Vercel][2])

---

## 6. Vercel 환경변수는 지금 그대로

Vercel:

```text
Settings
→ Environment Variables
```

여기:

```text
Name: KMA_AUTH_KEY
Type: Secret / Sensitive
Value: 실제 기상청 키
```

**이게 오히려 제대로 된 설정이야.**

`VITE_KMA_AUTH_KEY` 필요 없음.

OpenWeatherMap은 현재 구조가 클라이언트 API 호출이라:

```text
VITE_OPENWEATHER_API_KEY
```

를 계속 사용할 수 있고,

KMA는:

```text
KMA_AUTH_KEY
```

를 서버에서만 사용.

즉 구조가 이렇게 된다.

```text
OpenWeatherMap
VITE_OPENWEATHER_API_KEY
→ Browser에서 사용

KMA
KMA_AUTH_KEY
→ Vercel 서버에서만 사용
```

---

## 7. GitHub Push

수정 후:

```bash
git add api/kma.js src/components/exercise/WeatherMetar.vue vercel.json
git commit -m "fix: proxy KMA API through Vercel function"
git push origin main
```

Vercel이 GitHub와 연결되어 있으면 자동 재배포될 거야.

---

## 8. 배포 후 제일 먼저 테스트

새 배포가 끝나면 브라우저에서 직접:

```text
https://너의주소.vercel.app/api/kma?type=metar&icao=RKSI
```

접속.

### 성공

XML이 나오면:

```text
Vercel Function ✅
KMA Secret ✅
METAR API ✅
```

전부 성공.

그다음 홈페이지 새로고침하면 공항 카드도 떠야 해.

### 이런 게 나오면

```json
{
  "message": "KMA_AUTH_KEY 환경변수가 설정되지 않았습니다."
}
```

Vercel Environment 설정 문제.

### 401

Secret 값 자체가 잘못 등록된 것.

### XML 정상

완료.

---

지금 네 상황에서는 **`Config VITE_KMA_AUTH_KEY`를 어떻게든 등록하는 것보다 이 방식이 기술적으로 더 올바른 해결책**이야.

그리고 교수님께도 설명하기 좋아:

> 클라이언트에 API Key가 노출되는 문제를 방지하기 위해 KMA 인증키를 Vercel Secret Environment Variable로 관리하고, Vercel Serverless Function을 Proxy로 구성하여 기상청 METAR API를 연동하였다.

이렇게 되면 단순히 “배포 오류 수정”이 아니라 **API Key 보안까지 개선한 배포 구조**가 된다.

[1]: https://vite.dev/guide/env-and-mode?utm_source=chatgpt.com "Env Variables and Modes | Vite"
[2]: https://vercel.com/docs/frameworks/frontend/vite?utm_source=chatgpt.com "Vite on Vercel"
