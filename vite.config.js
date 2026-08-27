import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // [커스텀 추가] 로컬 개발 서버(Dev Server) 속성 제어
  server: {
    port: 3000, // 개발 서버의 네트워크 포트를 3000번으로 고정 명세
    open: true, // 프로세스 기동(npm run dev) 시 기본 웹 브라우저를 자동 실행
    proxy: {
      // 기상청 API허브(apihub.kma.go.kr)는 CORS 헤더를 내려주지 않아 브라우저에서 직접 호출이 막힘.
      // 개발 서버가 대신 요청을 중계(proxy)하도록 우회.
      '/kma-api': {
        target: 'https://apihub.kma.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kma-api/, ''),
      },
    },
  },
  // [커스텀 추가 2] 컴파일 완료된 산출물(Production Build) 사양 제어
  build: {
    outDir: 'dist', // 최종 정적 리소스(HTML, JS, CSS)가 저장될 출력 디렉토리명 지정
  },
})
