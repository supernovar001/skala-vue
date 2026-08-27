import { ref } from 'vue'
import { defineStore } from 'pinia'

// 요구조건 5. 본인만의 추가 Store: 즐겨찾기 도시를 페이지 이동과 무관하게 전역으로 공유
export const useFavoriteStore = defineStore('favorite', () => {
  // state: 즐겨찾기로 지정된 도시 ID (예: 'city_01'). 한 번에 하나만 지정 가능.
  const favoriteCity = ref(null)

  // getters: 특정 도시 ID가 현재 즐겨찾기인지 조회
  function isFavorite(cityId) {
    return favoriteCity.value === cityId
  }

  // actions: 즐겨찾기 지정/해제 토글
  function toggleFavorite(cityId) {
    favoriteCity.value = favoriteCity.value === cityId ? null : cityId
  }

  return {
    favoriteCity,
    isFavorite,
    toggleFavorite,
  }
})
