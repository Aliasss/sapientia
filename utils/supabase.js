import { createClient } from '@supabase/supabase-js';

// Supabase 환경 변수에서 URL과 API 키 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// 환경 변수가 없는 경우 경고
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 인증 상태 변경 감지 함수
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// 현재 세션 가져오기
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// 사용자 로그인 상태 확인
export const isUserLoggedIn = async () => {
  const session = await getCurrentSession();
  return !!session;
};

// 관리자 확인 함수
export const isAdmin = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '').split(',');
  return adminEmails.includes(user.email);
};

export default supabase; 