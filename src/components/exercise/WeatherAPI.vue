// [최종 변경사항]
// 1. 외부 UI 라이브러리 daisyUI(Tailwind CSS 기반)를 적용해 card/btn/badge/modal/collapse/alert/loading으로 재구성
// 2. Mock 데이터를 실제 OpenWeatherMap 데이터로 교체 (day6에서 만든 공용 캐시(weatherCache.js)를 재사용해 추가 호출 없이 공유)
// 3. OpenWeatherMap의 다른 API(5 Day / 3 Hour Forecast)를 카드별 daisyUI collapse로 온디맨드 추가
// 4. 기타 외부 API(sunrise-sunset.org)를 카드별 daisyUI collapse로 온디맨드 추가
// 5. 상세보기를 window.alert 대신 daisyUI dialog 모달로 대체
// 6. 검색/상태바/즐겨찾기/watch·watchEffect 등 기존 기능은 그대로 유지
<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import axios from 'axios'
import { fetchCachedWeatherList } from '@/utils/weatherCache'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

// 요구사항 1 : 실제 OpenWeatherMap 데이터 (WeatherHomeView와 같은 공용 캐시를 공유해 API 호출이 늘어나지 않음)
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

// 요구사항 2 : OpenWeatherMap의 다른 API(5 Day / 3 Hour Forecast) — 카드를 펼칠 때만 온디맨드 조회
const cityEnglishName = { city_01: 'Seoul', city_02: 'Suwon', city_03: 'Busan' }
const forecastByCity = ref({})
const forecastLoading = ref({})

const loadForecast = async (id) => {
  if (forecastByCity.value[id] || forecastLoading.value[id]) return
  forecastLoading.value = { ...forecastLoading.value, [id]: true }
  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { q: cityEnglishName[id], appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    forecastByCity.value = {
      ...forecastByCity.value,
      [id]: res.data.list.slice(0, 4).map((item) => ({
        time: item.dt_txt.slice(5, 16), // "MM-DD HH:mm"
        temp: Math.round(item.main.temp),
        status: item.weather[0].description,
      })),
    }
  } catch (error) {
    console.error('🔴 예보 API 연동 실패:', error)
    forecastByCity.value = { ...forecastByCity.value, [id]: [] }
  } finally {
    forecastLoading.value = { ...forecastLoading.value, [id]: false }
  }
}

// 요구사항 3 : 기타 외부 API(sunrise-sunset.org, 무인증) — 카드를 펼칠 때만 온디맨드 조회
const cityCoords = {
  city_01: { lat: 37.5665, lon: 126.978 }, // 서울
  city_02: { lat: 37.2636, lon: 127.0286 }, // 수원
  city_03: { lat: 35.1796, lon: 129.0756 }, // 부산
}
const sunTimesByCity = ref({})
const sunLoading = ref({})

const loadSunTimes = async (id) => {
  if (sunTimesByCity.value[id] || sunLoading.value[id]) return
  sunLoading.value = { ...sunLoading.value, [id]: true }
  try {
    const coords = cityCoords[id]
    const res = await axios.get('https://api.sunrise-sunset.org/json', {
      params: { lat: coords.lat, lng: coords.lon, tzid: 'Asia/Seoul' },
    })
    sunTimesByCity.value = { ...sunTimesByCity.value, [id]: res.data.results }
  } catch (error) {
    console.error('🔴 일출·일몰 API 연동 실패:', error)
    sunTimesByCity.value = { ...sunTimesByCity.value, [id]: null }
  } finally {
    sunLoading.value = { ...sunLoading.value, [id]: false }
  }
}

// 상세보기 : window.alert 대신 daisyUI 모달(<dialog>)로 표시
const detailModal = ref(null)
const selectedDetail = ref(null)

const showDetail = (item) => {
  selectedDetail.value = item
  detailModal.value?.showModal()
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
  <div class="mx-auto max-w-2xl space-y-4">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h3 class="card-title">🔍 도시 검색</h3>
        <input
          type="text"
          :value="searchQuery"
          @input="(e) => (searchQuery = e.target.value)"
          placeholder="검색할 도시 이름 입력"
          class="input input-bordered w-full"
        />
        <p class="text-sm text-base-content/70">
          검색 중인 도시: <strong>{{ searchQuery }}</strong>
        </p>
      </div>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h3 class="card-title">🏙️ 지역별 날씨 현황 (실시간 OpenWeatherMap 연동)</h3>

        <div v-if="isLoading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
        <div v-else-if="loadError" role="alert" class="alert alert-error">
          <span>{{ loadError }}</span>
        </div>

        <template v-else>
          <div
            v-for="item in filteredWeatherList"
            :key="item.id"
            class="card mb-3 cursor-pointer bg-base-200 shadow-sm"
            @click="selectedCityInfo = `${item.name}이 선택되었습니다.`"
          >
            <div class="card-body gap-2">
              <div class="flex items-center justify-between">
                <h4 class="font-bold">{{ item.name }} ({{ item.status }})</h4>
                <span class="badge" :class="item.temp >= 25 ? 'badge-error' : 'badge-info'">
                  {{ item.temp >= 25 ? '🔥 더움' : '❄️ 선선함' }}
                </span>
              </div>
              <p>현재 기온: {{ item.temp.toFixed(1) }}°C</p>

              <div class="card-actions justify-end">
                <button class="btn btn-outline btn-sm" @click.stop="showDetail(item)">상세보기</button>
                <button
                  class="btn btn-sm"
                  :class="favoriteCity === item.name ? 'btn-warning' : 'btn-ghost'"
                  @click.stop="toggleFavorite(item.name)"
                >
                  {{ favoriteCity === item.name ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
                </button>
              </div>

              <div class="collapse-arrow collapse bg-base-100" @click.stop>
                <input type="checkbox" @change="loadForecast(item.id)" />
                <div class="collapse-title text-sm font-medium">🕒 3시간 간격 예보 (OpenWeatherMap의 다른 API)</div>
                <div class="collapse-content text-sm">
                  <span v-if="forecastLoading[item.id]" class="loading loading-dots loading-sm"></span>
                  <ul v-else-if="forecastByCity[item.id]?.length">
                    <li v-for="f in forecastByCity[item.id]" :key="f.time">{{ f.time }} · {{ f.temp }}°C · {{ f.status }}</li>
                  </ul>
                  <p v-else-if="forecastByCity[item.id]" class="text-error">예보를 불러오지 못했습니다.</p>
                </div>
              </div>

              <div class="collapse-arrow collapse bg-base-100" @click.stop>
                <input type="checkbox" @change="loadSunTimes(item.id)" />
                <div class="collapse-title text-sm font-medium">🌅 일출·일몰 (기타 외부 API: sunrise-sunset.org)</div>
                <div class="collapse-content text-sm">
                  <span v-if="sunLoading[item.id]" class="loading loading-dots loading-sm"></span>
                  <p v-else-if="sunTimesByCity[item.id]">🌅 일출 {{ sunTimesByCity[item.id].sunrise }} · 🌇 일몰 {{ sunTimesByCity[item.id].sunset }}</p>
                  <p v-else-if="sunTimesByCity[item.id] === null" class="text-error">일출·일몰 정보를 불러오지 못했습니다.</p>
                </div>
              </div>
            </div>
          </div>

          <p v-if="filteredWeatherList.length === 0" class="py-4 text-center text-error">😭 검색 결과와 일치하는 도시가 없습니다.</p>
        </template>
      </div>
    </div>

    <p v-if="favoriteCityDetail" class="text-center">
      ⭐ 즐겨찾기: {{ favoriteCityDetail.name }} ({{ favoriteCityDetail.temp.toFixed(1) }}°C, {{ favoriteCityDetail.status }})
    </p>

    <div role="alert" class="alert alert-success justify-center font-bold">
      {{ selectedCityInfo }}
    </div>

    <dialog ref="detailModal" class="modal">
      <div v-if="selectedDetail" class="modal-box">
        <h3 class="text-lg font-bold">{{ selectedDetail.name }}</h3>
        <p class="py-2">현재 날씨는 [{{ selectedDetail.status }}] 상태입니다.</p>
        <p>기온: {{ selectedDetail.temp.toFixed(1) }}°C</p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">닫기</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
