import { signUp, signIn, signInWithSocial, resetPassword } from '../../utils/auth.js';

/**
 * 인증 모달 컴포넌트
 * 로그인, 회원가입, 비밀번호 재설정 기능을 제공하는 모달
 */
export class AuthModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentView = 'login'; // login, signup, forgot-password
  }

  connectedCallback() {
    this.render();
  }

  // 모달 열기
  open() {
    this.shadowRoot.querySelector('.auth-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // 모달 닫기
  close() {
    this.shadowRoot.querySelector('.auth-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  // 뷰 전환
  switchView(view) {
    this.currentView = view;
    this.render();
  }

  // 로그인 처리
  async handleLogin(e) {
    e.preventDefault();
    
    const email = this.shadowRoot.querySelector('#login-email').value;
    const password = this.shadowRoot.querySelector('#login-password').value;
    const messageEl = this.shadowRoot.querySelector('.auth-message');
    
    if (!email || !password) {
      messageEl.textContent = '이메일과 비밀번호를 입력해주세요.';
      messageEl.classList.add('error');
      return;
    }
    
    // 로딩 표시
    const submitBtn = this.shadowRoot.querySelector('#login-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '로그인 중...';
    
    const { session, error } = await signIn(email, password);
    
    if (error) {
      messageEl.textContent = error.message || '로그인에 실패했습니다.';
      messageEl.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = '로그인';
      return;
    }
    
    // 로그인 성공
    messageEl.textContent = '로그인 성공!';
    messageEl.classList.remove('error');
    messageEl.classList.add('success');
    
    // 모달 닫기
    setTimeout(() => this.close(), 1000);
  }

  // 회원가입 처리
  async handleSignup(e) {
    e.preventDefault();
    
    const name = this.shadowRoot.querySelector('#signup-name').value;
    const email = this.shadowRoot.querySelector('#signup-email').value;
    const password = this.shadowRoot.querySelector('#signup-password').value;
    const confirmPassword = this.shadowRoot.querySelector('#signup-confirm-password').value;
    const messageEl = this.shadowRoot.querySelector('.auth-message');
    
    if (!name || !email || !password) {
      messageEl.textContent = '모든 필드를 입력해주세요.';
      messageEl.classList.add('error');
      return;
    }
    
    if (password !== confirmPassword) {
      messageEl.textContent = '비밀번호가 일치하지 않습니다.';
      messageEl.classList.add('error');
      return;
    }
    
    if (password.length < 6) {
      messageEl.textContent = '비밀번호는 6자 이상이어야 합니다.';
      messageEl.classList.add('error');
      return;
    }
    
    // 로딩 표시
    const submitBtn = this.shadowRoot.querySelector('#signup-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '가입 중...';
    
    const { user, error } = await signUp(email, password, { name });
    
    if (error) {
      messageEl.textContent = error.message || '회원가입에 실패했습니다.';
      messageEl.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = '가입하기';
      return;
    }
    
    // 회원가입 성공
    messageEl.textContent = '회원가입 성공! 이메일 확인 후 로그인해주세요.';
    messageEl.classList.remove('error');
    messageEl.classList.add('success');
    
    // 로그인 화면으로 전환
    setTimeout(() => this.switchView('login'), 2000);
  }

  // 비밀번호 재설정 처리
  async handleResetPassword(e) {
    e.preventDefault();
    
    const email = this.shadowRoot.querySelector('#reset-email').value;
    const messageEl = this.shadowRoot.querySelector('.auth-message');
    
    if (!email) {
      messageEl.textContent = '이메일을 입력해주세요.';
      messageEl.classList.add('error');
      return;
    }
    
    // 로딩 표시
    const submitBtn = this.shadowRoot.querySelector('#reset-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '전송 중...';
    
    const { data, error } = await resetPassword(email);
    
    if (error) {
      messageEl.textContent = error.message || '비밀번호 재설정 이메일 발송에 실패했습니다.';
      messageEl.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = '재설정 링크 전송';
      return;
    }
    
    // 성공
    messageEl.textContent = '비밀번호 재설정 링크가 이메일로 전송되었습니다.';
    messageEl.classList.remove('error');
    messageEl.classList.add('success');
    
    // 로그인 화면으로 전환
    setTimeout(() => this.switchView('login'), 2000);
  }

  // 소셜 로그인 처리
  async handleSocialLogin(provider) {
    await signInWithSocial(provider);
  }

  render() {
    const styles = `
      :host {
        --primary-color: #333;
        --text-color: #fff;
        --error-color: #f44336;
        --success-color: #4CAF50;
        --input-bg: #222;
        --modal-bg: #111;
        --border-color: #444;
      }
      
      .auth-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .auth-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      
      .auth-modal {
        background-color: var(--modal-bg);
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        position: relative;
        overflow: hidden;
        color: var(--text-color);
        font-family: inherit;
      }
      
      .auth-modal-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .auth-modal-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
      
      .auth-modal-close {
        background: none;
        border: none;
        color: var(--text-color);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .auth-modal-body {
        padding: 20px;
      }
      
      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .form-label {
        font-size: 14px;
        font-weight: 500;
      }
      
      .form-input {
        padding: 12px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background-color: var(--input-bg);
        color: var(--text-color);
        font-size: 16px;
        width: 100%;
        box-sizing: border-box;
      }
      
      .form-input:focus {
        outline: none;
        border-color: #666;
      }
      
      .auth-submit {
        padding: 12px;
        border-radius: 4px;
        border: none;
        background-color: var(--primary-color);
        color: var(--text-color);
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .auth-submit:hover {
        background-color: #444;
      }
      
      .auth-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .auth-links {
        margin-top: 16px;
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }
      
      .auth-link {
        color: #888;
        text-decoration: none;
        cursor: pointer;
      }
      
      .auth-link:hover {
        color: var(--text-color);
        text-decoration: underline;
      }
      
      .auth-divider {
        display: flex;
        align-items: center;
        margin: 20px 0;
        color: #888;
      }
      
      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--border-color);
      }
      
      .auth-divider span {
        padding: 0 10px;
        font-size: 14px;
      }
      
      .social-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      
      .social-button {
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background-color: transparent;
        color: var(--text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        transition: all 0.3s ease;
      }
      
      .social-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .auth-message {
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 16px;
        font-size: 14px;
        display: none;
      }
      
      .auth-message.error {
        display: block;
        background-color: rgba(244, 67, 54, 0.1);
        color: var(--error-color);
        border: 1px solid var(--error-color);
      }
      
      .auth-message.success {
        display: block;
        background-color: rgba(76, 175, 80, 0.1);
        color: var(--success-color);
        border: 1px solid var(--success-color);
      }
    `;

    // 로그인 폼
    const loginForm = `
      <form id="login-form" class="auth-form">
        <div class="auth-message"></div>
        <div class="form-group">
          <label for="login-email" class="form-label">이메일</label>
          <input type="email" id="login-email" class="form-input" placeholder="이메일 주소" required>
        </div>
        <div class="form-group">
          <label for="login-password" class="form-label">비밀번호</label>
          <input type="password" id="login-password" class="form-input" placeholder="비밀번호" required>
        </div>
        <button type="submit" id="login-submit" class="auth-submit">로그인</button>
        
        <div class="auth-links">
          <span class="auth-link forgot-password-link">비밀번호 찾기</span>
          <span class="auth-link signup-link">회원가입</span>
        </div>
        
        <div class="auth-divider">
          <span>또는</span>
        </div>
        
        <div class="social-buttons">
          <button type="button" class="social-button google-login">Google</button>
          <button type="button" class="social-button github-login">GitHub</button>
        </div>
      </form>
    `;

    // 회원가입 폼
    const signupForm = `
      <form id="signup-form" class="auth-form">
        <div class="auth-message"></div>
        <div class="form-group">
          <label for="signup-name" class="form-label">이름</label>
          <input type="text" id="signup-name" class="form-input" placeholder="이름" required>
        </div>
        <div class="form-group">
          <label for="signup-email" class="form-label">이메일</label>
          <input type="email" id="signup-email" class="form-input" placeholder="이메일 주소" required>
        </div>
        <div class="form-group">
          <label for="signup-password" class="form-label">비밀번호</label>
          <input type="password" id="signup-password" class="form-input" placeholder="비밀번호 (6자 이상)" required>
        </div>
        <div class="form-group">
          <label for="signup-confirm-password" class="form-label">비밀번호 확인</label>
          <input type="password" id="signup-confirm-password" class="form-input" placeholder="비밀번호 확인" required>
        </div>
        <button type="submit" id="signup-submit" class="auth-submit">가입하기</button>
        
        <div class="auth-links">
          <span class="auth-link login-link">이미 계정이 있으신가요? 로그인</span>
        </div>
      </form>
    `;

    // 비밀번호 재설정 폼
    const resetPasswordForm = `
      <form id="reset-password-form" class="auth-form">
        <div class="auth-message"></div>
        <div class="form-group">
          <label for="reset-email" class="form-label">이메일</label>
          <input type="email" id="reset-email" class="form-input" placeholder="이메일 주소" required>
        </div>
        <button type="submit" id="reset-submit" class="auth-submit">재설정 링크 전송</button>
        
        <div class="auth-links">
          <span class="auth-link login-link">로그인으로 돌아가기</span>
        </div>
      </form>
    `;

    // 현재 뷰에 따라 제목과 폼 선택
    let title, form;
    switch (this.currentView) {
      case 'signup':
        title = '회원가입';
        form = signupForm;
        break;
      case 'forgot-password':
        title = '비밀번호 재설정';
        form = resetPasswordForm;
        break;
      default:
        title = '로그인';
        form = loginForm;
    }

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="auth-modal-overlay">
        <div class="auth-modal">
          <div class="auth-modal-header">
            <h2 class="auth-modal-title">${title}</h2>
            <button class="auth-modal-close">&times;</button>
          </div>
          <div class="auth-modal-body">
            ${form}
          </div>
        </div>
      </div>
    `;

    // 이벤트 리스너 추가
    this.addEventListeners();
  }

  addEventListeners() {
    // 모달 닫기
    this.shadowRoot.querySelector('.auth-modal-close').addEventListener('click', () => this.close());
    this.shadowRoot.querySelector('.auth-modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    // 현재 뷰에 따라 다른 이벤트 리스너 추가
    switch (this.currentView) {
      case 'login':
        this.shadowRoot.querySelector('#login-form').addEventListener('submit', (e) => this.handleLogin(e));
        this.shadowRoot.querySelector('.signup-link').addEventListener('click', () => this.switchView('signup'));
        this.shadowRoot.querySelector('.forgot-password-link').addEventListener('click', () => this.switchView('forgot-password'));
        this.shadowRoot.querySelector('.google-login').addEventListener('click', () => this.handleSocialLogin('google'));
        this.shadowRoot.querySelector('.github-login').addEventListener('click', () => this.handleSocialLogin('github'));
        break;
      case 'signup':
        this.shadowRoot.querySelector('#signup-form').addEventListener('submit', (e) => this.handleSignup(e));
        this.shadowRoot.querySelector('.login-link').addEventListener('click', () => this.switchView('login'));
        break;
      case 'forgot-password':
        this.shadowRoot.querySelector('#reset-password-form').addEventListener('submit', (e) => this.handleResetPassword(e));
        this.shadowRoot.querySelector('.login-link').addEventListener('click', () => this.switchView('login'));
        break;
    }
  }
}

// 웹 컴포넌트 등록
customElements.define('auth-modal', AuthModal); 