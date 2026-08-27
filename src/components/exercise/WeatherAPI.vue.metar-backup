// [최종 변경사항]
// 1. Mock weatherList를 기상청 API허브 METAR(AmmIwxxmService/getMetar) 실시간 항공기상으로 교체
// 2. METAR IWXXM(XML) 응답을 파싱해 기온/이슬점/기압(QNH)/바람/가시거리/운량을 추출하고 습도는 이슬점으로 근사 계산
// 3. 기상청의 다른 API(SIGMET 항공 특보)도 온디맨드로 시도하되, 별도 활용신청이 안 된 상태라 403 발생 시 안내 문구로 대체
// 4. 검색/상태바/즐겨찾기/watch·watchEffect 등 기존 기능은 그대로 유지
// (sunrise-sunset.org 연동은 페이지당 외부 호출 수를 줄이기 위해 제거함)
<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import axios from 'axios'

const KMA_AUTH_KEY = import.meta.env.VITE_KMA_AUTH_KEY

// 요구사항 1 : 항공기상관측(METAR) 대상 공항 (서울/수원/부산 대신 실제 METAR가 제공되는 공항으로 구성)
const airports = [
  { id: 'RKSI', name: '인천공항' },
  { id: 'RKSS', name: '김포공항' },
  { id: 'RKPK', name: '김해공항' },
  { id: 'RKPC', name: '제주공항' },
]

const weatherList = ref([])
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const isLoading = ref(false)
const loadError = ref('')

// 운량 코드 → 한글 상태/아이콘/배경 테마 매핑 (기존 목업의 sunny/rainy/cloudy/snowy 테마를 그대로 재사용)
const cloudMeta = {
  SKC: { status: '맑음', icon: '☀️', theme: 'sunny' },
  CLR: { status: '맑음', icon: '☀️', theme: 'sunny' },
  NSC: { status: '맑음', icon: '☀️', theme: 'sunny' },
  FEW: { status: '구름 조금', icon: '🌤️', theme: 'sunny' },
  SCT: { status: '구름 많음', icon: '⛅', theme: 'cloudy' },
  BKN: { status: '대체로 흐림', icon: '☁️', theme: 'cloudy' },
  OVC: { status: '흐림', icon: '☁️', theme: 'cloudy' },
}
const cloudPriority = ['OVC', 'BKN', 'SCT', 'FEW', 'NSC', 'SKC', 'CLR']

// 이슬점으로 상대습도를 근사 계산 (Magnus 공식)
const estimateHumidity = (tempC, dewC) => {
  const es = (t) => 6.112 * Math.exp((17.67 * t) / (t + 243.5))
  return Math.round((100 * es(dewC)) / es(tempC))
}

// METAR IWXXM(XML) 응답에서 필요한 필드만 추출
const parseMetarXml = (xmlText) => {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
  const resultCode = doc.getElementsByTagName('resultCode')[0]?.textContent
  if (resultCode !== '00') return null

  // 정기 관측(METAR) 또는 특별 관측(SPECI) 둘 다 대상
  const metarNode = doc.getElementsByTagName('iwxxm:METAR')[0] ?? doc.getElementsByTagName('iwxxm:SPECI')[0]
  if (!metarNode) return null // 관측 데이터가 없는 공항 (예: 군용 비행장)

  const getNum = (tag) => {
    const raw = metarNode.getElementsByTagName(tag)[0]?.textContent
    return raw != null ? Number(raw) : null
  }

  const layers = Array.from(metarNode.getElementsByTagName('iwxxm:CloudLayer')).map((layer) => ({
    amount: layer.getElementsByTagName('iwxxm:amount')[0]?.getAttribute('xlink:href')?.split('/').pop() ?? null,
    baseFt: layer.getElementsByTagName('iwxxm:base')[0]?.textContent,
  }))
  const dominantCloud = cloudPriority.map((code) => layers.find((l) => l.amount === code)).find(Boolean) ?? layers[0] ?? null

  return {
    airportName: metarNode.getElementsByTagName('aixm:name')[0]?.textContent ?? null,
    temp: getNum('iwxxm:airTemperature'),
    dewpoint: getNum('iwxxm:dewpointTemperature'),
    qnh: getNum('iwxxm:qnh'),
    windDir: getNum('iwxxm:meanWindDirection'),
    windSpeedKt: getNum('iwxxm:meanWindSpeed'),
    visibility: getNum('iwxxm:prevailingVisibility'),
    cloud: dominantCloud,
  }
}

const fetchAirportWeather = async (airport) => {
  const res = await axios.get('/kma-api/api/typ02/openApi/AmmIwxxmService/getMetar', {
    responseType: 'text',
    params: { pageNo: 1, numOfRows: 10, dataType: 'XML', icao: airport.id, authKey: KMA_AUTH_KEY },
  })
  const parsed = parseMetarXml(res.data)
  if (!parsed || parsed.temp == null) {
    return { id: airport.id, name: airport.name, temp: null, status: '관측자료 없음', icon: '❔', theme: 'cloudy' }
  }

  const meta = cloudMeta[parsed.cloud?.amount] ?? { status: '정보없음', icon: '❔', theme: 'cloudy' }

  return {
    id: airport.id,
    name: airport.name,
    temp: parsed.temp,
    status: meta.status,
    icon: meta.icon,
    theme: meta.theme,
    humidity: parsed.dewpoint != null ? estimateHumidity(parsed.temp, parsed.dewpoint) : null,
    wind: parsed.windSpeedKt != null ? Math.round(parsed.windSpeedKt * 0.514444 * 10) / 10 : null,
    qnh: parsed.qnh,
    visibility: parsed.visibility,
  }
}

// 요구사항 1 : 4개 공항의 실시간 METAR를 병렬 조회
const fetchAllAirports = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    weatherList.value = await Promise.all(airports.map(fetchAirportWeather))
  } catch (error) {
    console.error('🔴 METAR API 연동 실패:', error)
    loadError.value = '실시간 항공기상 데이터를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAllAirports)

// 요구사항 2 : 기상청의 다른 API(SIGMET, 항공 특보) — 공항별이 아니라 우리나라 전체 공역 단위 정보라 전역으로 한 번만 조회
const sigmetText = ref('')
const sigmetLoading = ref(false)

const fetchSigmet = async () => {
  sigmetLoading.value = true
  try {
    const res = await axios.get('/kma-api/api/typ02/openApi/AmmIwxxmService/getSigmet', {
      responseType: 'text',
      params: { pageNo: 1, numOfRows: 10, dataType: 'XML', authKey: KMA_AUTH_KEY },
    })
    sigmetText.value = res.data
  } catch (error) {
    // 403이면 activity 미승인(활용신청 필요), 그 외는 일반 네트워크/서버 오류
    sigmetText.value =
      error.response?.status === 403
        ? '⚠️ 이 API는 별도 활용신청이 필요합니다 (SIGMET). apihub.kma.go.kr 마이페이지에서 신청 후 다시 시도해 주세요.'
        : '⚠️ SIGMET 조회 중 오류가 발생했습니다.'
  } finally {
    sigmetLoading.value = false
  }
}

// 검색 필터링 (기존과 동일)
const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) {
    return weatherList.value
  }
  return weatherList.value.filter((item) => item.name.includes(query))
})

watch(selectedCityInfo, (newInfo) => {
  console.log(`👁️‍🗨️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

watchEffect(() => {
  console.log(`🤖 [watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`)
})

// 상세보기 : METAR로 얻은 확장 정보(기압/가시거리/일출몰)까지 함께 안내
const showDetail = (item) => {
  window.alert(`${item.name}의 현재 날씨는 [${item.status}] 상태입니다.\n` + `기압(QNH): ${item.qnh ?? '정보없음'}hPa · 가시거리: ${item.visibility ?? '정보없음'}m`)
}

// 요구조건 5. 본인만의 반응형 상태 변수: 즐겨찾기 도시
const favoriteCity = ref(null)

const toggleFavorite = (cityName) => {
  favoriteCity.value = favoriteCity.value === cityName ? null : cityName
}

// 요구조건 5. 본인만의 Computed: 즐겨찾기로 지정한 도시의 상세 정보 조회
const favoriteCityDetail = computed(() => weatherList.value.find((item) => item.name === favoriteCity.value) ?? null)

// 요구조건 5. 본인만의 Watcher: 즐겨찾기 변경을 감시하여 콘솔로그 작성
watch(favoriteCity, (newCity, oldCity) => {
  if (newCity) {
    console.log(`⭐ [watch 감지] 즐겨찾기 도시가 "${oldCity ?? '없음'}" -> "${newCity}"(으)로 변경되었습니다.`)
  } else {
    console.log(`⭐ [watch 감지] "${oldCity}" 즐겨찾기가 해제되었습니다.`)
  }
})
</script>

<template>
  <div class="dashboard-wrapper">
    <section class="search-box">
      <h3>🔍 공항 검색</h3>
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 공항 이름 입력" />
      <p>
        검색 중인 공항: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <section class="list-box">
      <h3>⚠️ 항공 특보 (SIGMET, 다른 KMA API)</h3>
      <button class="btn-decoded" @click="fetchSigmet" :disabled="sigmetLoading">
        {{ sigmetLoading ? '조회 중...' : '항공 특보(SIGMET) 조회' }}
      </button>
      <p v-if="sigmetText" class="decoded-text">{{ sigmetText }}</p>
    </section>

    <section class="list-box">
      <h3>✈️ 공항별 항공기상 현황 (기상청 METAR 실시간 연동)</h3>

      <p v-if="isLoading" style="text-align: center; color: #3498db; font-weight: bold; padding: 20px 0">🔄 실시간 항공기상 데이터를 수신 중입니다...</p>
      <p v-else-if="loadError" style="text-align: center; color: #e74c3c; padding: 10px 0">{{ loadError }}</p>

      <template v-else>
        <div v-for="item in filteredWeatherList" :key="item.id" class="weather-card" :class="item.theme" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
          <h4>{{ item.icon }} {{ item.name }} ({{ item.status }})</h4>
          <p>현재 기온: {{ item.temp ?? '정보없음' }}°C</p>
          <p class="weather-meta">습도 {{ item.humidity ?? '정보없음' }}% · 바람 {{ item.wind ?? '정보없음' }}m/s</p>
          <p class="weather-meta">기압 {{ item.qnh ?? '정보없음' }}hPa · 가시거리 {{ item.visibility ?? '정보없음' }}m</p>

          <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
          <span v-else-if="item.temp != null" class="badge cool">❄️ 선선함 (25도 미만)</span>

          <button class="btn-detail" @click.stop="showDetail(item)">상세보기</button>
          <button class="btn-favorite" @click.stop="toggleFavorite(item.name)">
            {{ favoriteCity === item.name ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
          </button>
        </div>

        <p v-if="filteredWeatherList.length === 0" style="text-align: center; color: #e74c3c; padding: 10px 0">😭 검색 결과와 일치하는 공항이 없습니다.</p>
      </template>
    </section>

    <p v-if="favoriteCityDetail">⭐ 즐겨찾기: {{ favoriteCityDetail.name }} ({{ favoriteCityDetail.temp }}°C, {{ favoriteCityDetail.status }})</p>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>

<style>
@import '@/assets/exercise.css';
</style>

<style scoped>
.decoded-box {
  margin-top: 8px;
}
.btn-decoded {
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}
.decoded-text {
  margin-top: 6px;
  padding: 8px;
  background: #f1f2f6;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
