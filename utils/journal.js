import { supabase } from './supabase.js';

/**
 * 저널 항목 생성
 * @param {string} content - 저널 내용
 * @param {string} prompt - 저널 프롬프트
 * @param {Array<string>} tags - 태그 배열
 * @returns {Promise<{entry, error}>} - 생성된 저널 항목 또는 에러
 */
export const createJournalEntry = async (content, prompt = '', tags = []) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { entry: null, error: new Error('로그인이 필요합니다') };
    
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{
        user_id: user.id,
        content,
        prompt,
        tags
      }])
      .select();

    if (error) throw error;
    
    // 오프라인 백업을 위해 localStorage에도 저장
    saveToLocalStorage(data[0]);
    
    return { entry: data[0], error: null };
  } catch (error) {
    console.error('저널 항목 생성 에러:', error);
    
    // 오프라인 모드에서 localStorage에만 저장
    const offlineEntry = saveOfflineEntry(content, prompt, tags);
    
    return { entry: offlineEntry, error };
  }
};

/**
 * 저널 항목 업데이트
 * @param {string} id - 저널 항목 ID
 * @param {object} updates - 업데이트할 필드
 * @returns {Promise<{entry, error}>} - 업데이트된 저널 항목 또는 에러
 */
export const updateJournalEntry = async (id, updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { entry: null, error: new Error('로그인이 필요합니다') };
    
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    
    // 로컬 스토리지 업데이트
    updateLocalStorage(data[0]);
    
    return { entry: data[0], error: null };
  } catch (error) {
    console.error('저널 항목 업데이트 에러:', error);
    return { entry: null, error };
  }
};

/**
 * 저널 항목 삭제
 * @param {string} id - 저널 항목 ID
 * @returns {Promise<{success, error}>} - 성공 여부 또는 에러
 */
export const deleteJournalEntry = async (id) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: new Error('로그인이 필요합니다') };
    
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    // 로컬 스토리지에서도 삭제
    removeFromLocalStorage(id);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('저널 항목 삭제 에러:', error);
    return { success: false, error };
  }
};

/**
 * 저널 항목 가져오기 (페이지네이션)
 * @param {number} page - 페이지 번호 (0부터 시작)
 * @param {number} pageSize - 페이지 크기
 * @returns {Promise<{entries, count, error}>} - 저널 항목 배열, 총 개수, 에러
 */
export const getJournalEntries = async (page = 0, pageSize = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // 로그인하지 않은 경우 로컬 스토리지에서 가져오기
      return getLocalJournalEntries(page, pageSize);
    }
    
    const start = page * pageSize;
    const end = start + pageSize - 1;
    
    const { data, error, count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    
    // 오프라인 사용을 위해 로컬 스토리지에 저장
    syncToLocalStorage(data);
    
    return { entries: data, count, error: null };
  } catch (error) {
    console.error('저널 항목 가져오기 에러:', error);
    
    // 에러 발생 시 로컬 스토리지에서 가져오기
    return getLocalJournalEntries(page, pageSize);
  }
};

/**
 * 태그로 저널 항목 검색
 * @param {Array<string>} tags - 검색할 태그 배열
 * @returns {Promise<{entries, error}>} - 저널 항목 배열 또는 에러
 */
export const searchJournalByTags = async (tags) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { entries: [], error: new Error('로그인이 필요합니다') };
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .contains('tags', tags)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { entries: data, error: null };
  } catch (error) {
    console.error('태그 검색 에러:', error);
    return { entries: [], error };
  }
};

/**
 * 텍스트로 저널 항목 검색
 * @param {string} searchTerm - 검색어
 * @returns {Promise<{entries, error}>} - 저널 항목 배열 또는 에러
 */
export const searchJournalByText = async (searchTerm) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { entries: [], error: new Error('로그인이 필요합니다') };
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .textSearch('content', searchTerm)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { entries: data, error: null };
  } catch (error) {
    console.error('텍스트 검색 에러:', error);
    return { entries: [], error };
  }
};

// 로컬 스토리지 관련 함수들

/**
 * 로컬 스토리지에 저널 항목 저장
 * @param {object} entry - 저장할 저널 항목
 */
const saveToLocalStorage = (entry) => {
  try {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    
    // 이미 있는 항목이면 업데이트
    const index = entries.findIndex(e => e.id === entry.id);
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.unshift(entry);
    }
    
    localStorage.setItem('journalEntries', JSON.stringify(entries));
  } catch (error) {
    console.error('로컬 스토리지 저장 에러:', error);
  }
};

/**
 * 로컬 스토리지의 저널 항목 업데이트
 * @param {object} entry - 업데이트할 저널 항목
 */
const updateLocalStorage = (entry) => {
  try {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const index = entries.findIndex(e => e.id === entry.id);
    
    if (index >= 0) {
      entries[index] = entry;
      localStorage.setItem('journalEntries', JSON.stringify(entries));
    }
  } catch (error) {
    console.error('로컬 스토리지 업데이트 에러:', error);
  }
};

/**
 * 로컬 스토리지에서 저널 항목 삭제
 * @param {string} id - 삭제할 저널 항목 ID
 */
const removeFromLocalStorage = (id) => {
  try {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('journalEntries', JSON.stringify(entries));
  } catch (error) {
    console.error('로컬 스토리지 삭제 에러:', error);
  }
};

/**
 * 여러 저널 항목을 로컬 스토리지에 동기화
 * @param {Array<object>} entries - 저널 항목 배열
 */
const syncToLocalStorage = (entries) => {
  try {
    let localEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    
    // 기존 항목 유지하면서 새 항목 추가/업데이트
    entries.forEach(entry => {
      const index = localEntries.findIndex(e => e.id === entry.id);
      if (index >= 0) {
        localEntries[index] = entry;
      } else {
        localEntries.push(entry);
      }
    });
    
    // 생성일 기준 내림차순 정렬
    localEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    localStorage.setItem('journalEntries', JSON.stringify(localEntries));
  } catch (error) {
    console.error('로컬 스토리지 동기화 에러:', error);
  }
};

/**
 * 오프라인 상태에서 저널 항목 생성
 * @param {string} content - 저널 내용
 * @param {string} prompt - 저널 프롬프트
 * @param {Array<string>} tags - 태그 배열
 * @returns {object} - 생성된 오프라인 저널 항목
 */
const saveOfflineEntry = (content, prompt = '', tags = []) => {
  try {
    const offlineEntry = {
      id: `offline_${Date.now()}`,
      content,
      prompt,
      tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_offline: true
    };
    
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    entries.unshift(offlineEntry);
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    
    return offlineEntry;
  } catch (error) {
    console.error('오프라인 저장 에러:', error);
    return null;
  }
};

/**
 * 로컬 스토리지에서 저널 항목 가져오기 (페이지네이션)
 * @param {number} page - 페이지 번호
 * @param {number} pageSize - 페이지 크기
 * @returns {object} - 저널 항목 배열, 총 개수
 */
const getLocalJournalEntries = (page = 0, pageSize = 10) => {
  try {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedEntries = entries.slice(start, end);
    
    return { entries: paginatedEntries, count: entries.length, error: null };
  } catch (error) {
    console.error('로컬 스토리지 읽기 에러:', error);
    return { entries: [], count: 0, error };
  }
};

/**
 * 오프라인 저널 항목을 서버에 동기화
 * @returns {Promise<{success, error}>} - 성공 여부 또는 에러
 */
export const syncOfflineEntries = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: new Error('로그인이 필요합니다') };
    
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const offlineEntries = entries.filter(entry => entry.is_offline);
    
    if (offlineEntries.length === 0) {
      return { success: true, error: null };
    }
    
    // 오프라인 항목을 서버에 저장
    for (const entry of offlineEntries) {
      const { content, prompt, tags } = entry;
      
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: user.id,
          content,
          prompt,
          tags
        }])
        .select();
      
      if (error) throw error;
      
      // 로컬 스토리지에서 오프라인 항목 제거하고 서버 항목 추가
      removeFromLocalStorage(entry.id);
      saveToLocalStorage(data[0]);
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('오프라인 항목 동기화 에러:', error);
    return { success: false, error };
  }
};

export default {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  searchJournalByTags,
  searchJournalByText,
  syncOfflineEntries
}; 