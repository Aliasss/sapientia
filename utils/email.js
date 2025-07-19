import { supabase } from './supabase.js';

/**
 * 뉴스레터 구독
 * @param {string} email - 구독할 이메일 주소
 * @returns {Promise<{success, error}>} - 성공 여부 또는 에러
 */
export const subscribeToNewsletter = async (email) => {
  try {
    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return { success: false, error: new Error('유효하지 않은 이메일 주소입니다') };
    }
    
    // 이미 구독 중인지 확인
    const { data: existingSubscription, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116: 결과 없음
      throw checkError;
    }
    
    // 이미 구독 중이면 활성화 상태 업데이트
    if (existingSubscription) {
      if (existingSubscription.is_active) {
        return { success: true, message: '이미 구독 중인 이메일입니다', error: null };
      }
      
      const { error: updateError } = await supabase
        .from('newsletter_subscriptions')
        .update({ is_active: true, subscribed_at: new Date() })
        .eq('id', existingSubscription.id);
      
      if (updateError) throw updateError;
      
      return { success: true, message: '구독이 다시 활성화되었습니다', error: null };
    }
    
    // 새 구독 생성
    const { error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert([{ email }]);
    
    if (insertError) throw insertError;
    
    // 구독 확인 이메일 발송 (Supabase Edge Function 호출)
    await sendConfirmationEmail(email);
    
    return { success: true, message: '구독이 완료되었습니다', error: null };
  } catch (error) {
    console.error('뉴스레터 구독 에러:', error);
    return { success: false, error };
  }
};

/**
 * 뉴스레터 구독 취소
 * @param {string} email - 구독 취소할 이메일 주소
 * @returns {Promise<{success, error}>} - 성공 여부 또는 에러
 */
export const unsubscribeFromNewsletter = async (email) => {
  try {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({ is_active: false })
      .eq('email', email);
    
    if (error) throw error;
    
    return { success: true, message: '구독이 취소되었습니다', error: null };
  } catch (error) {
    console.error('뉴스레터 구독 취소 에러:', error);
    return { success: false, error };
  }
};

/**
 * 구독 확인 이메일 발송 (Supabase Edge Function)
 * @param {string} email - 이메일 주소
 * @returns {Promise<{success, error}>} - 성공 여부 또는 에러
 */
const sendConfirmationEmail = async (email) => {
  try {
    // Supabase Edge Function 호출
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        email,
        type: 'subscription_confirmation'
      }
    });
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('확인 이메일 발송 에러:', error);
    return { success: false, error };
  }
};

/**
 * 뉴스레터 발송 (관리자 전용)
 * @param {string} subject - 이메일 제목
 * @param {string} content - 이메일 내용 (HTML)
 * @returns {Promise<{success, error}>} - 성공 여부 또는 에러
 */
export const sendNewsletter = async (subject, content) => {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return { success: false, error: new Error('관리자 권한이 필요합니다') };
    }
    
    // 활성 구독자 가져오기
    const { data: subscribers, error: fetchError } = await supabase
      .from('newsletter_subscriptions')
      .select('email')
      .eq('is_active', true);
    
    if (fetchError) throw fetchError;
    
    if (subscribers.length === 0) {
      return { success: false, error: new Error('활성 구독자가 없습니다') };
    }
    
    // Supabase Edge Function 호출
    const { error: sendError } = await supabase.functions.invoke('send-newsletter', {
      body: {
        subject,
        content,
        recipients: subscribers.map(sub => sub.email)
      }
    });
    
    if (sendError) throw sendError;
    
    return { success: true, message: `${subscribers.length}명에게 뉴스레터가 발송되었습니다`, error: null };
  } catch (error) {
    console.error('뉴스레터 발송 에러:', error);
    return { success: false, error };
  }
};

/**
 * 관리자 권한 확인
 * @returns {Promise<boolean>} - 관리자 여부
 */
const checkAdminPermission = async () => {
  try {
    const { data } = await supabase.rpc('is_admin');
    return data || false;
  } catch (error) {
    console.error('관리자 권한 확인 에러:', error);
    return false;
  }
};

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일 주소
 * @returns {boolean} - 유효 여부
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export default {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  sendNewsletter
}; 