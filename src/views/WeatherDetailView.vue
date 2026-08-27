<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import { useFavoriteStore } from '@/stores/favoriteStore'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()

const mockDetails = {
  city_01: { name: '대한민국 서울특별시', temp: 28, status: '맑음', humidity: '55%', wind: '2.5m/s', icon: '☀️' },
  city_02: { name: '경기도 수원시 영통구', temp: 24, status: '비', humidity: '85%', wind: '4.1m/s', icon: '🌧️' },
  city_03: { name: '부산광역시 해운대구', temp: 26, status: '구름', humidity: '65%', wind: '5.0m/s', icon: '☁️' },
}

const cityData = ref(null)

onMounted(() => {
  const id = route.params.cityId
  if (mockDetails[id]) {
    cityData.value = mockDetails[id]
  }
})

// 섭씨 원본 값을 현재 configStore.unit에 맞춰 변환
const displayTemp = computed(() => {
  if (!cityData.value) return 0
  const rawTemp = cityData.value.temp
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})

const isFavorite = computed(() => favoriteStore.isFavorite(route.params.cityId))
</script>

<template>
  <div class="detail-container">
    <h3>📊 지역별 상세 기상 관측 정보</h3>
    <hr />

    <div v-if="cityData" class="info-card">
      <h4>📍 지정 지역: {{ cityData.name }}</h4>
      <p>
        기온: <strong>{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
      </p>
      <p>기상 현황: {{ cityData.status }}</p>
      <p>대기 습도: {{ cityData.humidity }}</p>
      <p>현재 풍속: {{ cityData.wind }}</p>

      <button class="favorite-btn" @click="favoriteStore.toggleFavorite(route.params.cityId)">
        {{ isFavorite ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기 추가' }}
      </button>
    </div>
    <div v-else>
      <p>해당 지역의 상세 데이터 장부가 존재하지 않습니다.</p>
    </div>

    <button @click="router.push('/')" class="back-btn">← 메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.detail-container {
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.info-card {
  background: #f1f2f6;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
}
.favorite-btn {
  margin-top: 10px;
  padding: 6px 10px;
  cursor: pointer;
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
