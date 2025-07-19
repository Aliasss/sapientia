import { createJournalEntry, getJournalEntries, deleteJournalEntry, syncOfflineEntries } from '../../utils/journal.js';
import { isUserLoggedIn } from '../../utils/supabase.js';

/**
 * 저널 관리자 컴포넌트
 * 저널 항목 생성, 조회, 삭제 등의 기능을 제공
 */
export class JournalManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.entries = [];
    this.totalCount = 0;
    this.currentPage = 0;
    this.pageSize = 5;
    this.isLoading = false;
    this.isLoggedIn = false;
    this.prompt = '';
  }

  async connectedCallback() {
    // 로그인 상태 확인
    this.isLoggedIn = await isUserLoggedIn();
    
    // 오프라인 항목 동기화 시도
    if (this.isLoggedIn) {
      await syncOfflineEntries();
    }
    
    // 초기 데이터 로드
    await this.loadEntries();
    
    this.render();
    
    // 프롬프트 설정
    const promptAttr = this.getAttribute('prompt');
    if (promptAttr) {
      this.prompt = promptAttr;
      this.shadowRoot.querySelector('#journalPrompt').textContent = this.prompt;
    }
  }

  async loadEntries() {
    this.isLoading = true;
    
    try {
      const { entries, count, error } = await getJournalEntries(this.currentPage, this.pageSize);
      
      if (error) throw error;
      
      this.entries = entries;
      this.totalCount = count;
    } catch (error) {
      console.error('저널 항목 로드 에러:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async handleSave() {
    const textarea = this.shadowRoot.querySelector('#journalTextarea');
    const content = textarea.value.trim();
    
    if (!content) {
      this.showMessage('내용을 입력해주세요.', 'error');
      return;
    }
    
    const saveBtn = this.shadowRoot.querySelector('#saveJournal');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
    
    try {
      const { entry, error } = await createJournalEntry(content, this.prompt);
      
      if (error) throw error;
      
      textarea.value = '';
      this.showMessage('생각이 저장되었습니다.', 'success');
      
      // 새 항목 추가 및 UI 업데이트
      if (this.currentPage === 0) {
        this.entries.unshift(entry);
        if (this.entries.length > this.pageSize) {
          this.entries.pop();
        }
        this.totalCount++;
        this.renderEntries();
      } else {
        // 첫 페이지로 이동
        this.currentPage = 0;
        await this.loadEntries();
        this.renderEntries();
      }
    } catch (error) {
      console.error('저널 저장 에러:', error);
      this.showMessage('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '저장하기';
    }
  }

  async handleDelete(id) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const { success, error } = await deleteJournalEntry(id);
      
      if (error) throw error;
      
      if (success) {
        // UI에서 항목 제거
        this.entries = this.entries.filter(entry => entry.id !== id);
        this.totalCount--;
        this.showMessage('항목이 삭제되었습니다.', 'success');
        
        // 현재 페이지가 비었으면 이전 페이지로 이동
        if (this.entries.length === 0 && this.currentPage > 0) {
          this.currentPage--;
          await this.loadEntries();
        }
        
        this.renderEntries();
      }
    } catch (error) {
      console.error('저널 삭제 에러:', error);
      this.showMessage('삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  async handlePageChange(page) {
    if (page < 0 || page >= Math.ceil(this.totalCount / this.pageSize)) {
      return;
    }
    
    this.currentPage = page;
    await this.loadEntries();
    this.renderEntries();
    
    // 페이지 상단으로 스크롤
    this.shadowRoot.querySelector('.journal-entries').scrollTop = 0;
  }

  showMessage(text, type) {
    const messageEl = this.shadowRoot.querySelector('.journal-message');
    messageEl.textContent = text;
    messageEl.className = `journal-message ${type}`;
    
    // 3초 후 메시지 숨기기
    setTimeout(() => {
      messageEl.className = 'journal-message';
      messageEl.textContent = '';
    }, 3000);
  }

  render() {
    const styles = `
      :host {
        display: block;
        font-family: inherit;
        color: #fff;
      }
      
      .journal-container {
        background-color: #111;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .journal-header {
        padding: 20px;
        border-bottom: 1px solid #333;
      }
      
      .journal-prompt {
        font-size: 18px;
        font-weight: 500;
        margin: 0 0 16px;
      }
      
      .journal-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .journal-textarea {
        width: 100%;
        min-height: 120px;
        padding: 12px;
        border-radius: 4px;
        border: 1px solid #333;
        background-color: #1a1a1a;
        color: #fff;
        font-family: inherit;
        font-size: 16px;
        resize: vertical;
        box-sizing: border-box;
      }
      
      .journal-textarea:focus {
        outline: none;
        border-color: #555;
      }
      
      .journal-actions {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      
      .journal-btn {
        padding: 10px 16px;
        border-radius: 4px;
        border: none;
        background-color: #333;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .journal-btn:hover {
        background-color: #444;
        transform: translateY(-2px);
      }
      
      .journal-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .journal-btn-primary {
        background-color: #1a1a2e;
      }
      
      .journal-btn-primary:hover {
        background-color: #2a2a4e;
      }
      
      .journal-entries {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .journal-entry {
        background-color: #1a1a1a;
        border-radius: 4px;
        padding: 16px;
        position: relative;
      }
      
      .journal-entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 14px;
        color: #888;
      }
      
      .journal-entry-date {
        font-style: italic;
      }
      
      .journal-entry-content {
        white-space: pre-wrap;
        line-height: 1.5;
      }
      
      .journal-entry-delete {
        background: none;
        border: none;
        color: #888;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .journal-entry-delete:hover {
        color: #f44336;
      }
      
      .journal-empty {
        text-align: center;
        padding: 40px 0;
        color: #888;
        font-style: italic;
      }
      
      .journal-pagination {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid #333;
      }
      
      .journal-page-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid #333;
        background-color: transparent;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .journal-page-btn:hover {
        background-color: #333;
      }
      
      .journal-page-btn.active {
        background-color: #1a1a2e;
        border-color: #1a1a2e;
      }
      
      .journal-page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .journal-message {
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
        font-size: 14px;
        display: none;
      }
      
      .journal-message.error {
        display: block;
        background-color: rgba(244, 67, 54, 0.1);
        color: #f44336;
        border: 1px solid #f44336;
      }
      
      .journal-message.success {
        display: block;
        background-color: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
        border: 1px solid #4CAF50;
      }
      
      .journal-offline-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        background-color: #ff9800;
        color: #000;
        font-size: 12px;
        margin-left: 8px;
      }
      
      .journal-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      
      .journal-tag {
        padding: 4px 8px;
        border-radius: 20px;
        background-color: #333;
        color: #fff;
        font-size: 12px;
      }
      
      .journal-loading {
        text-align: center;
        padding: 20px;
        color: #888;
      }
      
      /* 스크롤바 스타일 */
      .journal-entries::-webkit-scrollbar {
        width: 8px;
      }
      
      .journal-entries::-webkit-scrollbar-track {
        background: #1a1a1a;
      }
      
      .journal-entries::-webkit-scrollbar-thumb {
        background: #333;
        border-radius: 4px;
      }
      
      .journal-entries::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="journal-container">
        <div class="journal-header">
          <h3 class="journal-prompt" id="journalPrompt">${this.prompt || '오늘의 생각을 기록해보세요.'}</h3>
          <div class="journal-form">
            <textarea class="journal-textarea" id="journalTextarea" placeholder="여기에 생각을 적어보세요..."></textarea>
            <div class="journal-actions">
              <button class="journal-btn" id="clearJournal">지우기</button>
              <button class="journal-btn journal-btn-primary" id="saveJournal">저장하기</button>
            </div>
            <div class="journal-message"></div>
          </div>
        </div>
        
        <div class="journal-entries" id="journalEntries">
          ${this.isLoading ? '<div class="journal-loading">로딩 중...</div>' : ''}
        </div>
        
        <div class="journal-pagination" id="journalPagination"></div>
      </div>
    `;

    // 이벤트 리스너 추가
    this.addEventListeners();
    
    // 저널 항목 렌더링
    this.renderEntries();
  }

  renderEntries() {
    const entriesContainer = this.shadowRoot.querySelector('#journalEntries');
    
    if (this.isLoading) {
      entriesContainer.innerHTML = '<div class="journal-loading">로딩 중...</div>';
      return;
    }
    
    if (this.entries.length === 0) {
      entriesContainer.innerHTML = '<div class="journal-empty">아직 기록된 생각이 없습니다. 첫 번째 생각을 기록해보세요!</div>';
      return;
    }
    
    const entriesHTML = this.entries.map(entry => {
      const date = new Date(entry.created_at);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();
      
      const offlineBadge = entry.is_offline ? '<span class="journal-offline-badge">오프라인</span>' : '';
      
      const tagsHTML = entry.tags && entry.tags.length > 0
        ? `
          <div class="journal-tags">
            ${entry.tags.map(tag => `<span class="journal-tag">${tag}</span>`).join('')}
          </div>
        `
        : '';
      
      return `
        <div class="journal-entry" data-id="${entry.id}">
          <div class="journal-entry-header">
            <span class="journal-entry-date">${formattedDate} ${formattedTime} ${offlineBadge}</span>
            <button class="journal-entry-delete" data-id="${entry.id}">&times;</button>
          </div>
          <div class="journal-entry-content">${entry.content}</div>
          ${tagsHTML}
        </div>
      `;
    }).join('');
    
    entriesContainer.innerHTML = entriesHTML;
    
    // 페이지네이션 렌더링
    this.renderPagination();
    
    // 삭제 버튼 이벤트 리스너 추가
    this.shadowRoot.querySelectorAll('.journal-entry-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        this.handleDelete(id);
      });
    });
  }

  renderPagination() {
    const paginationContainer = this.shadowRoot.querySelector('#journalPagination');
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    let paginationHTML = `
      <button class="journal-page-btn" id="prevPage" ${this.currentPage === 0 ? 'disabled' : ''}>
        &lt;
      </button>
    `;
    
    // 페이지 버튼 생성 (최대 5개)
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="journal-page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
          ${i + 1}
        </button>
      `;
    }
    
    paginationHTML += `
      <button class="journal-page-btn" id="nextPage" ${this.currentPage === totalPages - 1 ? 'disabled' : ''}>
        &gt;
      </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // 페이지네이션 이벤트 리스너 추가
    this.shadowRoot.querySelector('#prevPage').addEventListener('click', () => {
      if (this.currentPage > 0) {
        this.handlePageChange(this.currentPage - 1);
      }
    });
    
    this.shadowRoot.querySelector('#nextPage').addEventListener('click', () => {
      if (this.currentPage < totalPages - 1) {
        this.handlePageChange(this.currentPage + 1);
      }
    });
    
    this.shadowRoot.querySelectorAll('.journal-page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.getAttribute('data-page'));
        this.handlePageChange(page);
      });
    });
  }

  addEventListeners() {
    // 저장 버튼
    this.shadowRoot.querySelector('#saveJournal').addEventListener('click', () => this.handleSave());
    
    // 지우기 버튼
    this.shadowRoot.querySelector('#clearJournal').addEventListener('click', () => {
      this.shadowRoot.querySelector('#journalTextarea').value = '';
    });
    
    // 텍스트 영역 키 이벤트 (Ctrl+Enter로 저장)
    this.shadowRoot.querySelector('#journalTextarea').addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.handleSave();
      }
    });
  }

  // 프롬프트 업데이트
  setPrompt(prompt) {
    this.prompt = prompt;
    const promptEl = this.shadowRoot.querySelector('#journalPrompt');
    if (promptEl) {
      promptEl.textContent = prompt;
    }
  }

  // 속성 변경 감지
  static get observedAttributes() {
    return ['prompt'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'prompt' && oldValue !== newValue) {
      this.setPrompt(newValue);
    }
  }
}

// 웹 컴포넌트 등록
customElements.define('journal-manager', JournalManager); 