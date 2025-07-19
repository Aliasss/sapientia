import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 멀티페이지 앱 설정
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
    outDir: 'dist',
  },
  // 환경 변수 접두사 설정
  envPrefix: 'VITE_',
  // 정적 파일 서빙 설정
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  // 소스맵 생성
  sourcemap: true,
  // 기본 경로 설정
  base: '/',
  // 에셋 디렉토리
  assetsDir: 'assets',
  // 공개 디렉토리
  publicDir: 'public',
  // 플러그인
  plugins: [],
}); 