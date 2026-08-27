import axios from 'axios'

// App.vue가 같은 '/' 라우트를 가리키는 RouterView를 두 곳(과제4·과제5)에 두고 있어
// WeatherHomeView가 동시에 두 번 마운트된다. 일반 .js 모듈은 진짜 모듈 스코프를 가지므로
// (<script setup> 최상단과 달리 컴포넌트 인스턴스마다 재실행되지 않음) 이 파일에 캐시를
// 두면 두 인스턴스가 같은 요청 결과를 공유해서, 페이지 1회 로드당 API 호출이 6번이 아닌
// 3번만 나가게 된다.
const CACHE_TTL_MS = 30_000
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

let cachedPromise = null
let cachedAt = 0

const requestWeatherList = (apiKey) =>
  Promise.all([
    axios.get(BASE_URL, { params: { q: 'Seoul', appid: apiKey, units: 'metric', lang: 'kr' } }),
    axios.get(BASE_URL, { params: { q: 'Suwon', appid: apiKey, units: 'metric', lang: 'kr' } }),
    axios.get(BASE_URL, { params: { q: 'Busan', appid: apiKey, units: 'metric', lang: 'kr' } }),
  ]).then(([seoulRes, suwonRes, busanRes]) => [
    { id: 'city_01', name: '서울', temp: seoulRes.data.main.temp, status: seoulRes.data.weather[0].description },
    { id: 'city_02', name: '수원', temp: suwonRes.data.main.temp, status: suwonRes.data.weather[0].description },
    { id: 'city_03', name: '부산', temp: busanRes.data.main.temp, status: busanRes.data.weather[0].description },
  ])

export const fetchCachedWeatherList = (apiKey) => {
  const isFresh = cachedPromise && Date.now() - cachedAt < CACHE_TTL_MS
  if (!isFresh) {
    cachedAt = Date.now()
    cachedPromise = requestWeatherList(apiKey).catch((error) => {
      cachedPromise = null // 실패한 캐시는 다음 시도에서 재요청되도록 초기화
      throw error
    })
  }
  return cachedPromise
}
