<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Router 실습 단계라 아직 전역 스토어가 없으므로, WeatherHomeView와 동일한 Mock 데이터를 이 화면 전용으로 둔다.
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
])

const averageTemp = computed(() => {
  const total = weatherList.value.reduce((sum, item) => sum + item.temp, 0)
  return (total / weatherList.value.length).toFixed(1)
})

const hottestCity = computed(() => weatherList.value.reduce((max, item) => (item.temp > max.temp ? item : max)))

const coldestCity = computed(() => weatherList.value.reduce((min, item) => (item.temp < min.temp ? item : min)))
</script>

<template>
  <div class="stats-container">
    <h3>📊 날씨 통계</h3>
    <hr />

    <div class="stat-card">
      <p>평균 기온: <strong>{{ averageTemp }}°C</strong></p>
      <p>🔥 가장 더운 도시: <strong>{{ hottestCity.name }}</strong> ({{ hottestCity.temp }}°C)</p>
      <p>❄️ 가장 추운 도시: <strong>{{ coldestCity.name }}</strong> ({{ coldestCity.temp }}°C)</p>
    </div>

    <button @click="router.push('/')" class="back-btn">← 메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.stats-container {
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.stat-card {
  background: #f1f2f6;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  line-height: 1.8;
}
.back-btn {
  padding: 8px 12px;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
