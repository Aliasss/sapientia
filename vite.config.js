import { defineConfig } from 'vite';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        origin: 'content/origin.html',
        depth: 'content/depth.html',
        extension: 'content/extension.html',
        selfExistence: 'pillars/self-existence.html',
        natureCosmos: 'pillars/nature-cosmos.html',
        societyFuture: 'pillars/society-future.html',
        admin: 'admin/index.html',
        adminThemes: 'admin/themes.html',
        adminQuestions: 'admin/questions.html',
        adminNewsletter: 'admin/newsletter.html',
      },
    },
  },
  define: {
    // 환경 변수를 클라이언트에서 사용할 수 있도록 설정
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    'process.env.ADMIN_EMAILS': JSON.stringify(process.env.ADMIN_EMAILS),
  },
}); 