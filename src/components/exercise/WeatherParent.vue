<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 기존 핵심 비즈니스 로직(computed, watch)의 소유권은 안전하게 부모 콘텍스트가 격리 유지
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

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

// 요구조건 7. 본인의 Mockup 부분(즐겨찾기)을 WeatherCard에서 FavoriteButton으로 더 분리
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
    <BaseDashboardCard>
      <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />
    </BaseDashboardCard>

    <BaseDashboardCard>
      <h3>🏙️ 지역별 날씨 현황</h3>

      <WeatherCard
        v-for="item in filteredWeatherList"
        :key="item.id"
        :city-item="item"
        :is-favorite="favoriteCity === item.name"
        @select-card="(msg) => (selectedCityInfo = msg)"
        @click-detail="showDetail"
        @toggle-favorite="toggleFavorite"
      />

      <p v-if="filteredWeatherList.length === 0" style="text-align: center; color: #e74c3c; padding: 10px 0">😭 검색 결과와 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>

    <p v-if="favoriteCityDetail">⭐ 즐겨찾기: {{ favoriteCityDetail.name }} ({{ favoriteCityDetail.temp }}°C, {{ favoriteCityDetail.status }})</p>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  width: 600px;
  margin: 0 auto;
}
.status-bar {
  background: #e8f5e9;
  padding: 10px;
  text-align: center;
  color: #2e7d32;
  font-weight: bold;
  border-radius: 6px;
}
</style>
