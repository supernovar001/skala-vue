// [최종 변경사항]
// 1. Mock weatherList를 실제 OpenWeatherMap Current Weather Data API 데이터로 교체 (day6 공용 캐시(weatherCache.js) 재사용)
// 2. 상세보기 클릭 시 OpenWeatherMap의 다른 API(5 Day / 3 Hour Forecast)를 추가 호출하여 예보 표시
// 3. 기타 외부 API(sunrise-sunset.org)를 추가 호출하여 일출·일몰 표시
// 4. 검색/상태바/즐겨찾기/watch·watchEffect 등 기존 기능은 그대로 유지
<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import axios from 'axios'
import { fetchCachedWeatherList } from '@/utils/weatherCache'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const cityEnglishName = { city_01: 'Seoul', city_02: 'Suwon', city_03: 'Busan' }

// 요구사항 1 : 실제 OpenWeatherMap 데이터 (과제6 daisyUI 섹션과 같은 공용 캐시를 공유해 API 호출이 늘어나지 않음)
const weatherList = ref([])
const isLoading = ref(false)
const loadError = ref('')

const fetchRealTimeWeather = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    weatherList.value = await fetchCachedWeatherList(API_KEY)
  } catch (error) {
    console.error('🔴 날씨 API 연동 실패:', error)
    loadError.value = '실시간 날씨 데이터를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchRealTimeWeather)

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

watch(selectedCityInfo, (newInfo) => {
  console.log(`👁️‍🗨️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

watchEffect(() => {
  console.log(`🤖 [watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`)
})

// 요구사항 2·3 : 상세보기를 펼칠 때 Current Weather(습도/풍속/좌표) + Forecast + sunrise-sunset.org를 함께 조회
const expandedCityId = ref(null)
const detailByCity = ref({})
const detailLoading = ref({})

const loadDetail = async (id) => {
  if (detailByCity.value[id] || detailLoading.value[id]) return
  detailLoading.value = { ...detailLoading.value, [id]: true }
  try {
    const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: cityEnglishName[id], appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    const raw = weatherRes.data

    // 요구사항 2 : OpenWeatherMap의 다른 API(5 Day / 3 Hour Forecast)
    const forecastRes = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { q: cityEnglishName[id], appid: API_KEY, units: 'metric', lang: 'kr' },
    })

    // 요구사항 3 : 기타 외부 API(sunrise-sunset.org, 무인증)
    const sunRes = await axios.get('https://api.sunrise-sunset.org/json', {
      params: { lat: raw.coord.lat, lng: raw.coord.lon, tzid: 'Asia/Seoul' },
    })

    detailByCity.value = {
      ...detailByCity.value,
      [id]: {
        humidity: `${raw.main.humidity}%`,
        wind: `${raw.wind.speed}m/s`,
        forecastList: forecastRes.data.list.slice(0, 4).map((item) => ({
          time: item.dt_txt.slice(5, 16),
          temp: Math.round(item.main.temp),
          status: item.weather[0].description,
        })),
        sunrise: sunRes.data.results.sunrise,
        sunset: sunRes.data.results.sunset,
      },
    }
  } catch (error) {
    console.error('🔴 상세 정보 API 연동 실패:', error)
    detailByCity.value = { ...detailByCity.value, [id]: null }
  } finally {
    detailLoading.value = { ...detailLoading.value, [id]: false }
  }
}

const toggleDetail = (id) => {
  expandedCityId.value = expandedCityId.value === id ? null : id
  if (expandedCityId.value) {
    loadDetail(id)
  }
}

// 요구조건 5. 본인만의 반응형 상태 변수: 즐겨찾기 도시
const favoriteCity = ref(null)

const toggleFavorite = (cityName) => {
  favoriteCity.value = favoriteCity.value === cityName ? null : cityName
}

const favoriteCityDetail = computed(() => weatherList.value.find((item) => item.name === favoriteCity.value) ?? null)

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
      <h3>🔍 도시 검색</h3>
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <section class="list-box">
      <h3>🏙️ 지역별 날씨 현황 (실시간 OpenWeatherMap 연동)</h3>

      <p v-if="isLoading" style="text-align: center; color: #3498db; font-weight: bold; padding: 20px 0">🔄 실시간 기상 데이터를 수신 중입니다...</p>
      <p v-else-if="loadError" style="text-align: center; color: #e74c3c; padding: 10px 0">{{ loadError }}</p>

      <template v-else>
        <div v-for="item in filteredWeatherList" :key="item.id" class="weather-card" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
          <h4>{{ item.name }} ({{ item.status }})</h4>
          <p>현재 기온: {{ item.temp.toFixed(1) }}°C</p>

          <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
          <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

          <button class="btn-detail" @click.stop="toggleDetail(item.id)">{{ expandedCityId === item.id ? '접기' : '상세보기' }}</button>
          <button class="btn-favorite" @click.stop="toggleFavorite(item.name)">
            {{ favoriteCity === item.name ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
          </button>

          <div v-if="expandedCityId === item.id" class="axios-detail" @click.stop>
            <p v-if="detailLoading[item.id]">🔄 상세 정보를 불러오는 중입니다...</p>
            <template v-else-if="detailByCity[item.id]">
              <p>대기 습도: {{ detailByCity[item.id].humidity }} · 풍속: {{ detailByCity[item.id].wind }}</p>
              <p>🌅 일출 {{ detailByCity[item.id].sunrise }} · 🌇 일몰 {{ detailByCity[item.id].sunset }}</p>
              <p class="axios-detail-subtitle">🕒 3시간 간격 예보</p>
              <ul>
                <li v-for="f in detailByCity[item.id].forecastList" :key="f.time">{{ f.time }} · {{ f.temp }}°C · {{ f.status }}</li>
              </ul>
            </template>
            <p v-else style="color: #e74c3c">상세 정보를 불러오지 못했습니다.</p>
          </div>
        </div>

        <p v-if="filteredWeatherList.length === 0" style="text-align: center; color: #e74c3c; padding: 10px 0">😭 검색 결과와 일치하는 도시가 없습니다.</p>
      </template>
    </section>

    <p v-if="favoriteCityDetail">⭐ 즐겨찾기: {{ favoriteCityDetail.name }} ({{ favoriteCityDetail.temp.toFixed(1) }}°C, {{ favoriteCityDetail.status }})</p>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>

<style>
@import '@/assets/exercise.css';
</style>

<style scoped>
.axios-detail {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 14px;
}
.axios-detail-subtitle {
  font-weight: bold;
  margin-top: 8px;
}
.axios-detail ul {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
}
.axios-detail li {
  padding: 2px 0;
}
</style>
