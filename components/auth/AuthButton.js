import { supabase, isUserLoggedIn } from '../../utils/supabase.js';
import { signOut } from '../../utils/auth.js';

/**
 * 인증 버튼 컴포넌트
 * 로그인 상태에 따라 로그인/로그아웃 버튼을 표시
 */
export class AuthButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isLoggedIn = false;
    this.user = null;
  }

  async connectedCallback() {
    // 초기 로그인 상태 확인
    await this.checkAuthState();
    
    // 인증 상태 변경 감지
    this.unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.isLoggedIn = true;
        const { data: { user } } = await supabase.auth.getUser();
        this.user = user;
      } else if (event === 'SIGNED_OUT') {
        this.isLoggedIn = false;
        this.user = null;
      }
      this.render();
    });
    
    this.render();
  }

  disconnectedCallback() {
    // 구독 해제
    if (this.unsubscribe) {
      this.unsubscribe.data.subscription.unsubscribe();
    }
  }

  async checkAuthState() {
    this.isLoggedIn = await isUserLoggedIn();
    if (this.isLoggedIn) {
      const { data: { user } } = await supabase.auth.getUser();
      this.user = user;
    }
  }

  handleLogin() {
    // 커스텀 이벤트 발생
    const event = new CustomEvent('authButtonClick', {
      bubbles: true,
      composed: true, // Shadow DOM 경계를 넘어 이벤트 전파
      detail: { action: 'login' }
    });
    this.dispatchEvent(event);
    
    // 로그인 모달 열기
    const authModal = document.querySelector('auth-modal');
    if (authModal) {
      authModal.open();
    } else {
      // 모달이 없으면 생성
      const modal = document.createElement('auth-modal');
      document.body.appendChild(modal);
      setTimeout(() => modal.open(), 0);
    }
  }

  async handleLogout() {
    const { error } = await signOut();
    if (error) {
      console.error('로그아웃 에러:', error);
    }
  }

  render() {
    const styles = `
      :host {
        display: inline-block;
      }
      
      .auth-button {
        background-color: transparent;
        color: #fff;
        border: 1px solid #fff;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        transition: all 0.3s ease;
      }
      
      .auth-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .user-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #444;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #fff;
      }
      
      .dropdown {
        position: relative;
        display: inline-block;
      }
      
      .dropdown-content {
        display: none;
        position: absolute;
        right: 0;
        background-color: #1a1a24;
        min-width: 160px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        z-index: 1;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .dropdown:hover .dropdown-content {
        display: block;
      }
      
      .dropdown-item {
        color: #fff;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .dropdown-item:hover {
        background-color: #2a2a35;
      }
    `;

    const getInitials = (name) => {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const content = this.isLoggedIn
      ? `
        <div class="dropdown">
          <div class="user-info auth-button">
            <div class="user-avatar">${getInitials(this.user?.user_metadata?.name || this.user?.email)}</div>
            <span>${this.user?.user_metadata?.name || this.user?.email?.split('@')[0]}</span>
          </div>
          <div class="dropdown-content">
            <a class="dropdown-item" href="/profile.html">프로필</a>
            <a class="dropdown-item" href="/journal.html">내 저널</a>
            <div class="dropdown-item logout-btn">로그아웃</div>
          </div>
        </div>
      `
      : `<button class="auth-button login-btn">로그인</button>`;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${content}
    `;

    // 이벤트 리스너 추가
    if (this.isLoggedIn) {
      this.shadowRoot.querySelector('.logout-btn').addEventListener('click', () => this.handleLogout());
    } else {
      this.shadowRoot.querySelector('.login-btn').addEventListener('click', () => this.handleLogin());
    }
  }
}

// 웹 컴포넌트 등록
customElements.define('auth-button', AuthButton); 