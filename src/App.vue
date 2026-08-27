// App.vue.exercise 내용과 동일함 //
<script setup>
import WeatherMockup from './components/exercise/WeatherMockup.vue'
import WeatherComposition from './components/exercise/WeatherComposition.vue'
import WeatherParent from './components/exercise/WeatherParent.vue'
import WeatherAPI from './components/exercise/WeatherAPI.vue'
import WeatherAxios from './components/exercise/WeatherAxios.vue'
import WeatherMetar from './components/exercise/WeatherMetar.vue'
import UnitToggler from './components/exercise/UnitToggler.vue'
</script>

<template>
  <div class="app-container">
    <h1>⛅ 과제 2: 날씨 (Mockup)</h1>
    <hr />
    <WeatherMockup />
  </div>

  <div class="app-container">
    <h1>⛅ 과제 3: 날씨 (컴포지션)</h1>
    <hr />
    <WeatherComposition />
  </div>

  <div class="app-container">
    <h1>⛅ 과제 4: 날씨 (컴포넌트)</h1>
    <hr />
    <WeatherParent />
  </div>


  <div class="app-container">
    <h1>⛅ 과제 5: 라우터적용</h1>
    <hr />
    <div class="dashboard-wrapper">
      <nav class="navigation-bar">
        <RouterLink to="/" class="nav-item">🌦️ 날씨 대시보드</RouterLink>
        <span class="divider">|</span>
        <RouterLink to="/about" class="nav-item">ℹ️ 서비스 소개</RouterLink>
        <span class="divider">|</span>
        <RouterLink to="/stats" class="nav-item">📊 날씨 통계</RouterLink>
      </nav>
      <main>
        <RouterView />
        <!-- RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView-->
      </main>
    </div>
  </div>

  <div class="app-container">
    <h1>⛅ 과제 6: 스토어적용</h1>
    <hr />
    <div class="dashboard-wrapper">
      <nav class="navigation-bar">
        <RouterLink to="/" class="nav-item">🌦️ 날씨 대시보드</RouterLink>
        <span class="divider">|</span>
        <RouterLink to="/about" class="nav-item">ℹ️ 서비스 소개</RouterLink>
        <UnitToggler />
      </nav>
      <main>
        <RouterView />
      </main>
    </div>
  </div>


  <div class="app-container">
    <h1>⛅ 과제 7: 날씨 (Axios + 외부 API 연동)</h1>
    <p>상세보기 클릭 시에 습도, 풍속, 일출, 일몰, 3시간 간격예보가 나타납니다</p>
    <hr />
    <WeatherAxios />
  </div>
<!--
  <div class="app-container">
    <h1>⛅ 과제 6: 날씨 (UI Library - daisyUI)</h1>
    <hr />
    <WeatherAPI />
  </div> -->

  <div class="app-container">
    <h1>⛅ 과제 8: 날씨 (UI Library with 기상청 METAR)</h1>
    <hr />
    <WeatherAPI />
    <WeatherMetar />
  </div>
</template>

<style>
/* ⚠️ 외부 스타일 파일(예: 버튼 디자인 뭉치)을 이 방 안으로 쏙 가리켜 가져옵니다 */
@import '@/assets/exercise.css';
</style>
