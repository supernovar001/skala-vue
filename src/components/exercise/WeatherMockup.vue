<script setup>
import { ref, computed } from 'vue'
const weatherMessages = {
  맑음: '야외활동하기 좋아요 ☀️',
  비: '우산을 챙기세요 ☔',
  눈: '미끄럼 주의 ❄️',
  구름: '선선한 하루예요 ☁️',
}

// 4일차 API 연동을 대비한 가상의 백엔드 데이터 배열 (v-for 및 :key 실습용)
//Mockup 데이터 수정
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', icon: '☀️', theme: 'sunny' },
  { id: 'city_02', name: '수원', temp: 24, status: '비', icon: '🌧️', theme: 'rainy' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', icon: '☁️', theme: 'cloudy' },
  { id: 'city_04', name: '강릉', temp: -1, status: '눈', icon: '❄️', theme: 'snowy' },
])

// 검색어 및 알림창 제어용 데이터 (v-model 대용 한글 처리 및 이벤트 실습용)
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const filteredWeatherList = computed(() =>
  weatherList.value.filter((item) => item.name.includes(searchQuery.value)),
)

// // 알림 대행 함수 (window 객체 격리 우회)
// 4. 이벤트 및 수식어
// - 지역별 날씨 현황 카드를 누르면 상태바에“{도시}이 선택되었습니다.” 표기
// - 지역별 날씨 현황 카드 내부의 [상세보기] 버튼을 누르면 버블링 없이 해당 도시의 날씨 내용을 window.alert로 띄운다

const showDetail = (cityId) => {
  const detail = weatherList.value.find((item) => item.id === cityId)
  if (!detail) return

  window.alert(`${detail.name}의 현재 날씨는 [${detail.status}] 상태입니다.`)
}


</script>

<template>
  <div class="dashboard-wrapper">
    <section class="search-box">
      <h3>🔍 도시 검색</h3>
      <!-- input type="text" v-model="searchQuery" placeholder="검색할 도시 이름 입력" / -->
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <section class="list-box">
      <h3>🏙️ 지역별 날씨 현황</h3>

      <!-- <div v-for="item in weatherList" :key="item.id" class="weather-card" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
        <h4>{{ item.name }} ({{ item.status }})</h4>
        <p>현재 기온: {{ item.temp }}°C</p> -->
        <div v-for="item in filteredWeatherList" :key="item.id" class="weather-card" :class="item.theme" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
          <h4>{{ item.icon }} {{ item.name }} ({{ item.status }})</h4>
          <p>현재 기온: {{ item.temp }}°C</p>
          <!-- // weather-message 내용 추가!! status = '맑음' → 야외활동하기 좋아요 ☀️ -->
        <p class="weather-message">{{ weatherMessages[item.status] }}</p>
        <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
        <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

        <button class="btn-detail" @click.stop="showDetail(item.id)">상세보기</button>
      </div>
    </section>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>
