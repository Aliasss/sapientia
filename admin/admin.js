import { supabase, isAdmin } from '../utils/supabase.js';
import { signOut } from '../utils/auth.js';

// 관리자 권한 확인
async function checkAdminAccess() {
  try {
    const isLoggedIn = await supabase.auth.getSession();
    if (!isLoggedIn.data.session) {
      // 로그인되지 않은 경우 로그인 페이지로 리디렉션
      window.location.href = '../index.html';
      return false;
    }
    
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      // 관리자가 아닌 경우 메인 페이지로 리디렉션
      alert('관리자 권한이 필요합니다.');
      window.location.href = '../index.html';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('권한 확인 에러:', error);
    window.location.href = '../index.html';
    return false;
  }
}

// 현재 날짜 표시
function updateCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    dateElement.textContent = now.toLocaleDateString('ko-KR', options);
  }
}

// 통계 데이터 로드
async function loadStats() {
  try {
    // 사용자 수
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (userError) throw userError;
    
    // 저널 항목 수
    const { count: journalCount, error: journalError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true });
    
    if (journalError) throw journalError;
    
    // 뉴스레터 구독자 수
    const { count: subscriberCount, error: subscriberError } = await supabase
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (subscriberError) throw subscriberError;
    
    // 콘텐츠 테마 수
    const { count: themeCount, error: themeError } = await supabase
      .from('content_themes')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);
    
    if (themeError) throw themeError;
    
    // 통계 업데이트
    document.getElementById('totalUsers').textContent = userCount || 0;
    document.getElementById('totalJournalEntries').textContent = journalCount || 0;
    document.getElementById('totalSubscribers').textContent = subscriberCount || 0;
    document.getElementById('totalThemes').textContent = themeCount || 0;
  } catch (error) {
    console.error('통계 로드 에러:', error);
    showMessage('통계 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

// 최근 활동 로드
async function loadRecentActivities() {
  const tableBody = document.querySelector('#recentActivitiesTable tbody');
  if (!tableBody) return;
  
  try {
    // 최근 사용자 등록
    const { data: recentUsers, error: userError } = await supabase
      .from('profiles')
      .select('created_at, email')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (userError) throw userError;
    
    // 최근 저널 항목
    const { data: recentJournals, error: journalError } = await supabase
      .from('journal_entries')
      .select('created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (journalError) throw journalError;
    
    // 최근 구독
    const { data: recentSubscriptions, error: subError } = await supabase
      .from('newsletter_subscriptions')
      .select('subscribed_at, email')
      .order('subscribed_at', { ascending: false })
      .limit(5);
    
    if (subError) throw subError;
    
    // 최근 콘텐츠 업데이트
    const { data: recentThemes, error: themeError } = await supabase
      .from('content_themes')
      .select('updated_at, title')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (themeError) throw themeError;
    
    // 모든 활동 합치기 및 정렬
    const activities = [
      ...recentUsers.map(user => ({
        date: new Date(user.created_at),
        type: '사용자 등록',
        description: `새 사용자: ${user.email}`
      })),
      ...recentJournals.map(journal => ({
        date: new Date(journal.created_at),
        type: '저널 작성',
        description: `사용자 ID: ${journal.user_id.slice(0, 8)}...`
      })),
      ...recentSubscriptions.map(sub => ({
        date: new Date(sub.subscribed_at),
        type: '뉴스레터 구독',
        description: `구독자: ${sub.email}`
      })),
      ...recentThemes.map(theme => ({
        date: new Date(theme.updated_at),
        type: '콘텐츠 업데이트',
        description: `테마: ${theme.title}`
      }))
    ];
    
    // 날짜 기준 내림차순 정렬
    activities.sort((a, b) => b.date - a.date);
    
    // 최대 10개만 표시
    const recentActivities = activities.slice(0, 10);
    
    if (recentActivities.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="admin-table-loading">활동 내역이 없습니다.</td></tr>';
      return;
    }
    
    // 테이블 내용 업데이트
    tableBody.innerHTML = recentActivities.map(activity => `
      <tr>
        <td>${formatDate(activity.date)}</td>
        <td>${activity.type}</td>
        <td>${activity.description}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('최근 활동 로드 에러:', error);
    tableBody.innerHTML = '<tr><td colspan="3" class="admin-table-loading">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
  }
}

// 날짜 포맷팅
function formatDate(date) {
  const options = { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('ko-KR', options);
}

// 메시지 표시
function showMessage(text, type = 'info') {
  // 기존 메시지 제거
  const existingMessage = document.querySelector('.admin-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // 새 메시지 생성
  const message = document.createElement('div');
  message.className = `admin-message admin-message-${type}`;
  message.textContent = text;
  
  // 메시지 삽입
  const header = document.querySelector('.admin-header');
  if (header) {
    header.insertAdjacentElement('afterend', message);
  }
  
  // 3초 후 메시지 숨기기
  setTimeout(() => {
    message.style.opacity = '0';
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

// 데이터 동기화
async function syncData() {
  try {
    // 여기서는 간단히 통계를 다시 로드
    await loadStats();
    await loadRecentActivities();
    showMessage('데이터가 성공적으로 동기화되었습니다.', 'success');
  } catch (error) {
    console.error('데이터 동기화 에러:', error);
    showMessage('데이터 동기화 중 오류가 발생했습니다.', 'error');
  }
}

// 로그아웃
async function handleLogout() {
  try {
    await signOut();
    window.location.href = '../index.html';
  } catch (error) {
    console.error('로그아웃 에러:', error);
    showMessage('로그아웃 중 오류가 발생했습니다.', 'error');
  }
}

// 페이지 초기화
async function initPage() {
  // 관리자 권한 확인
  const isAuthorized = await checkAdminAccess();
  if (!isAuthorized) return;
  
  // 현재 날짜 표시
  updateCurrentDate();
  
  // 통계 데이터 로드
  await loadStats();
  
  // 최근 활동 로드
  await loadRecentActivities();
  
  // 이벤트 리스너 설정
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  const syncDataBtn = document.getElementById('syncDataBtn');
  if (syncDataBtn) {
    syncDataBtn.addEventListener('click', (e) => {
      e.preventDefault();
      syncData();
    });
  }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPage); 