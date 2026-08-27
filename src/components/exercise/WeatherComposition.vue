// [최종 변경사항]
// 1. weatherList 배열을 v-for와 :key="item.id"로 날씨 카드에 반복 출력
// 2. 기온이 25도 이상인지에 따라 v-if로 더움/선선함 라벨 표시
// 3. :value와 @input으로 한글 도시 검색어를 동기화하고 결과 출력
// 4. 카드 클릭 시 선택 도시를 상태바에 표시
// 5. 상세보기 버튼은 @click.stop으로 버블링을 막고 window.alert 실행
// 6. 습도와 풍속 데이터를 추가하고 exercise.css를 연결해 목업 확장
<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

// 1. [1일차 데이터] 가상의 백엔드 데이터 배열
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', icon: '☀️', theme: 'sunny', humidity: 55, wind: 2.5 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', icon: '🌧️', theme: 'rainy', humidity: 85, wind: 4.1 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', icon: '☁️', theme: 'cloudy', humidity: 65, wind: 5.0 },
  { id: 'city_04', name: '강릉', temp: -1, status: '눈', icon: '❄️', theme: 'snowy', humidity: 70, wind: 3.2 }, //과제2 컴포지션에 내용추가됨
])
// 2. [1일차 데이터] 검색어 및 알림창 제어용 데이터
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 3. [2일차 추가] computed를 활용한 실시간 검색 필터링 연산기 (★핵심)
const filteredWeatherList = computed(() => {
  // 사용자가 입력한 검색어의 앞뒤 공백을 제거합니다.
  const query = searchQuery.value.trim()

  // 검색어가 비어있다면 원본 weatherList를 그대로 보여줍니다.
  if (!query) {
    return weatherList.value
  }

  // 검색어가 포함된 도시만 칼같이 필터링하여 실시간으로 뱉어냅니다.
  return weatherList.value.filter((item) => item.name.includes(query))
})

// 4. [2일차 추가] watch를 활용한 선택 도시 추적 센서
// selectedCityInfo의 문구 변화를 감시하여 후속 로그를 처리합니다.
watch(selectedCityInfo, (newInfo) => {
  console.log(`👁️‍🗨️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

// 5. [2일차 추가] watchEffect를 활용한 자동 의존성 API 로그 시뮬레이션
// 타이핑할 때마다 변하는 searchQuery를 AI CCTV처럼 자동 추적합니다.
watchEffect(() => {
  console.log(`🤖 [watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`)
})

// 알림 대행 함수
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
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
      <h3>🔍 도시 검색</h3>
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <section class="list-box">
      <h3>🏙️ 지역별 날씨 현황</h3>

      <div v-for="item in filteredWeatherList" :key="item.id" class="weather-card" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
        <h4>{{ item.name }} ({{ item.status }})</h4>
        <p>현재 기온: {{ item.temp }}°C</p>
        <p class="weather-meta">습도 {{ item.humidity }}% · 바람 {{ item.wind }}m/s</p>

        <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
        <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

        <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">상세보기</button>
        <button class="btn-favorite" @click.stop="toggleFavorite(item.name)">
          {{ favoriteCity === item.name ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
        </button>
      </div>

      <p v-if="filteredWeatherList.length === 0" style="text-align: center; color: #e74c3c; padding: 10px 0">😭 검색 결과와 일치하는 도시가 없습니다.</p>
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
