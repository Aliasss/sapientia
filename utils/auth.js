import { supabase } from './supabase.js';

/**
 * 이메일/비밀번호로 회원가입
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @param {object} metadata - 추가 메타데이터 (이름 등)
 * @returns {Promise<{user, error}>} - 사용자 객체 또는 에러
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    console.log('회원가입 시도:', email); // 디버깅용 로그 추가
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}`, // 간단하게 루트 URL로 변경
      }
    });

    if (error) {
      console.error('회원가입 에러:', error);
      throw error;
    }

    console.log('회원가입 응답:', data); // 디버깅용 로그 추가
    
    // 회원가입 성공 시 프로필 생성
    if (data.user) {
      await createProfile(data.user.id, email, metadata.name);
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('회원가입 에러:', error);
    return { user: null, error };
  }
};

/**
 * 사용자 프로필 생성
 * @param {string} userId - 사용자 ID
 * @param {string} email - 사용자 이메일
 * @param {string} name - 사용자 이름
 * @returns {Promise<{profile, error}>} - 프로필 객체 또는 에러
 */
export const createProfile = async (userId, email, name = '') => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, email, name }])
      .select();

    if (error) throw error;
    return { profile: data[0], error: null };
  } catch (error) {
    console.error('프로필 생성 에러:', error);
    return { profile: null, error };
  }
};

/**
 * 이메일/비밀번호로 로그인
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<{session, error}>} - 세션 객체 또는 에러
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error) {
    console.error('로그인 에러:', error);
    return { session: null, error };
  }
};

/**
 * 소셜 로그인 (Google, GitHub 등)
 * @param {string} provider - 소셜 제공자 (google, github 등)
 * @returns {Promise<void>}
 */
export const signInWithSocial = async (provider) => {
  try {
    console.log(`소셜 로그인 시도: ${provider}`); // 디버깅용 로그 추가
    console.log(`현재 URL: ${window.location.href}`);
    console.log(`리디렉션 URL: ${window.location.origin}`);
    
    // 소셜 로그인 요청 전 네트워크 상태 확인
    const online = navigator.onLine;
    console.log(`네트워크 상태: ${online ? '온라인' : '오프라인'}`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}?auth=callback`,
        scopes: provider === 'google' ? 'email profile' : '',
      },
    });

    if (error) {
      console.error(`${provider} 로그인 에러:`, error);
      throw error;
    }
    
    console.log('소셜 로그인 응답:', data); // 디버깅용 로그 추가
    return { data, error: null };
  } catch (error) {
    console.error(`${provider} 로그인 에러:`, error);
    return { data: null, error };
  }
};

/**
 * 로그아웃
 * @returns {Promise<{error}>} - 에러 객체 (있는 경우)
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('로그아웃 에러:', error);
    return { error };
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 * @param {string} email - 사용자 이메일
 * @returns {Promise<{data, error}>} - 결과 데이터 또는 에러
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    return { data: null, error };
  }
};

/**
 * 새 비밀번호 설정
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<{data, error}>} - 결과 데이터 또는 에러
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('비밀번호 업데이트 에러:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 프로필 가져오기
 * @returns {Promise<{profile, error}>} - 프로필 객체 또는 에러
 */
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { profile: null, error: new Error('사용자를 찾을 수 없습니다') };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error) {
    console.error('프로필 가져오기 에러:', error);
    return { profile: null, error };
  }
};

/**
 * 사용자 프로필 업데이트
 * @param {object} updates - 업데이트할 프로필 데이터
 * @returns {Promise<{profile, error}>} - 업데이트된 프로필 또는 에러
 */
export const updateProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { profile: null, error: new Error('사용자를 찾을 수 없습니다') };
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', user.id)
      .select();

    if (error) throw error;
    return { profile: data[0], error: null };
  } catch (error) {
    console.error('프로필 업데이트 에러:', error);
    return { profile: null, error };
  }
};

export default {
  signUp,
  signIn,
  signInWithSocial,
  signOut,
  resetPassword,
  updatePassword,
  getUserProfile,
  updateProfile,
}; 