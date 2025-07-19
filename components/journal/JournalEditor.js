import { createJournalEntry, updateJournalEntry } from '../../utils/journal.js';

/**
 * 저널 에디터 컴포넌트
 * 저널 항목 생성 및 편집을 위한 리치 텍스트 에디터
 */
export class JournalEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.entry = null;
    this.isEditing = false;
    this.prompt = '';
    this.tags = [];
    this.autoSaveInterval = null;
    this.autoSaveDelay = 5000; // 5초마다 자동 저장
    this.isDirty = false;
  }

  connectedCallback() {
    // 초기 속성 설정
    if (this.hasAttribute('entry-id')) {
      this.isEditing = true;
      const entryId = this.getAttribute('entry-id');
      this.loadEntry(entryId);
    }
    
    if (this.hasAttribute('prompt')) {
      this.prompt = this.getAttribute('prompt');
    }
    
    this.render();
    
    // 자동 저장 설정
    this.setupAutoSave();
  }

  disconnectedCallback() {
    // 자동 저장 해제
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // 변경 사항이 있으면 마지막으로 저장
    if (this.isDirty && this.isEditing && this.entry) {
      this.saveEntry();
    }
  }

  async loadEntry(id) {
    try {
      // 여기서는 간단하게 구현. 실제로는 journal.js의 함수를 사용해야 함
      const response = await fetch(`/api/journal/${id}`);
      if (!response.ok) throw new Error('저널 항목을 불러올 수 없습니다');
      
      this.entry = await response.json();
      
      // 에디터 내용 업데이트
      if (this.shadowRoot) {
        const editor = this.shadowRoot.querySelector('#journalContent');
        if (editor) {
          editor.innerHTML = this.entry.content;
        }
        
        // 태그 업데이트
        this.tags = this.entry.tags || [];
        this.updateTagsUI();
      }
    } catch (error) {
      console.error('저널 항목 로드 에러:', error);
      this.showMessage('저널 항목을 불러올 수 없습니다', 'error');
    }
  }

  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.isDirty && this.isEditing && this.entry) {
        this.saveEntry();
      }
    }, this.autoSaveDelay);
  }

  async saveEntry() {
    const content = this.shadowRoot.querySelector('#journalContent').innerHTML;
    
    if (!content.trim()) {
      this.showMessage('내용을 입력해주세요', 'error');
      return false;
    }
    
    try {
      if (this.isEditing && this.entry) {
        // 기존 항목 업데이트
        const { entry, error } = await updateJournalEntry(this.entry.id, {
          content,
          tags: this.tags
        });
        
        if (error) throw error;
        
        this.entry = entry;
        this.isDirty = false;
        this.showMessage('저널이 업데이트되었습니다', 'success');
        return true;
      } else {
        // 새 항목 생성
        const { entry, error } = await createJournalEntry(content, this.prompt, this.tags);
        
        if (error) throw error;
        
        this.entry = entry;
        this.isEditing = true;
        this.isDirty = false;
        this.showMessage('저널이 저장되었습니다', 'success');
        
        // ID 속성 업데이트
        this.setAttribute('entry-id', entry.id);
        
        return true;
      }
    } catch (error) {
      console.error('저널 저장 에러:', error);
      this.showMessage('저장 중 오류가 발생했습니다', 'error');
      return false;
    }
  }

  addTag(tag) {
    tag = tag.trim();
    if (!tag) return;
    
    // 중복 태그 방지
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updateTagsUI();
      this.isDirty = true;
    }
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index !== -1) {
      this.tags.splice(index, 1);
      this.updateTagsUI();
      this.isDirty = true;
    }
  }

  updateTagsUI() {
    const tagsContainer = this.shadowRoot.querySelector('#journalTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = this.tags.map(tag => `
      <div class="journal-tag">
        <span>${tag}</span>
        <button class="journal-tag-remove" data-tag="${tag}">&times;</button>
      </div>
    `).join('');
    
    // 태그 삭제 버튼 이벤트 리스너 추가
    this.shadowRoot.querySelectorAll('.journal-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        this.removeTag(tag);
      });
    });
  }

  showMessage(text, type) {
    const messageEl = this.shadowRoot.querySelector('.journal-message');
    if (!messageEl) return;
    
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
      
      .journal-editor {
        background-color: #111;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .journal-toolbar {
        display: flex;
        padding: 10px;
        border-bottom: 1px solid #333;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .journal-tool {
        background: none;
        border: none;
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .journal-tool:hover {
        background-color: #333;
      }
      
      .journal-tool.active {
        background-color: #1a1a2e;
      }
      
      .journal-content {
        flex: 1;
        padding: 16px;
        min-height: 200px;
        outline: none;
        overflow-y: auto;
        line-height: 1.6;
      }
      
      .journal-content:focus {
        outline: none;
      }
      
      .journal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-top: 1px solid #333;
      }
      
      .journal-tags-container {
        padding: 10px;
        border-top: 1px solid #333;
      }
      
      .journal-tags-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .journal-tags-title {
        font-size: 14px;
        font-weight: 500;
        margin: 0;
      }
      
      .journal-tags-input-container {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
      }
      
      .journal-tags-input {
        flex: 1;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #333;
        background-color: #1a1a1a;
        color: #fff;
        font-size: 14px;
      }
      
      .journal-tags-input:focus {
        outline: none;
        border-color: #555;
      }
      
      .journal-tags-add {
        padding: 8px 12px;
        border-radius: 4px;
        border: none;
        background-color: #1a1a2e;
        color: #fff;
        cursor: pointer;
      }
      
      .journal-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .journal-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 16px;
        background-color: #333;
        font-size: 12px;
      }
      
      .journal-tag-remove {
        background: none;
        border: none;
        color: #ccc;
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
      }
      
      .journal-tag-remove:hover {
        color: #fff;
        background-color: #555;
      }
      
      .journal-save {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        background-color: #1a1a2e;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .journal-save:hover {
        background-color: #2a2a4e;
      }
      
      .journal-status {
        font-size: 12px;
        color: #888;
      }
      
      .journal-message {
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        margin-top: 10px;
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
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="journal-editor">
        <div class="journal-toolbar">
          <button class="journal-tool" data-command="bold" title="굵게">
            <span>B</span>
          </button>
          <button class="journal-tool" data-command="italic" title="기울임">
            <span>I</span>
          </button>
          <button class="journal-tool" data-command="underline" title="밑줄">
            <span>U</span>
          </button>
          <button class="journal-tool" data-command="strikeThrough" title="취소선">
            <span>S</span>
          </button>
          <button class="journal-tool" data-command="insertUnorderedList" title="글머리 기호">
            <span>•</span>
          </button>
          <button class="journal-tool" data-command="insertOrderedList" title="번호 매기기">
            <span>1.</span>
          </button>
          <button class="journal-tool" data-command="createLink" title="링크">
            <span>🔗</span>
          </button>
        </div>
        
        <div class="journal-content" id="journalContent" contenteditable="true"></div>
        
        <div class="journal-tags-container">
          <div class="journal-tags-header">
            <h4 class="journal-tags-title">태그</h4>
          </div>
          
          <div class="journal-tags-input-container">
            <input type="text" class="journal-tags-input" id="tagInput" placeholder="태그 추가 (Enter 키)">
            <button class="journal-tags-add" id="addTagBtn">추가</button>
          </div>
          
          <div class="journal-tags" id="journalTags"></div>
        </div>
        
        <div class="journal-footer">
          <span class="journal-status" id="journalStatus"></span>
          <button class="journal-save" id="saveBtn">저장</button>
        </div>
        
        <div class="journal-message"></div>
      </div>
    `;

    this.addEventListeners();
  }

  addEventListeners() {
    // 에디터 도구 이벤트
    this.shadowRoot.querySelectorAll('.journal-tool').forEach(tool => {
      tool.addEventListener('click', () => {
        const command = tool.getAttribute('data-command');
        
        if (command === 'createLink') {
          const url = prompt('링크 URL을 입력하세요:');
          if (url) {
            document.execCommand(command, false, url);
          }
        } else {
          document.execCommand(command, false, null);
        }
        
        // 변경 감지
        this.isDirty = true;
      });
    });
    
    // 에디터 내용 변경 감지
    const editor = this.shadowRoot.querySelector('#journalContent');
    editor.addEventListener('input', () => {
      this.isDirty = true;
      this.updateStatus('편집 중...');
    });
    
    // 태그 추가
    const tagInput = this.shadowRoot.querySelector('#tagInput');
    const addTagBtn = this.shadowRoot.querySelector('#addTagBtn');
    
    const handleAddTag = () => {
      const tag = tagInput.value.trim();
      if (tag) {
        this.addTag(tag);
        tagInput.value = '';
      }
    };
    
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    });
    
    addTagBtn.addEventListener('click', handleAddTag);
    
    // 저장 버튼
    this.shadowRoot.querySelector('#saveBtn').addEventListener('click', () => {
      this.saveEntry();
    });
  }

  updateStatus(text) {
    const statusEl = this.shadowRoot.querySelector('#journalStatus');
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  // 속성 변경 감지
  static get observedAttributes() {
    return ['entry-id', 'prompt'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'entry-id' && oldValue !== newValue) {
      this.isEditing = true;
      this.loadEntry(newValue);
    } else if (name === 'prompt' && oldValue !== newValue) {
      this.prompt = newValue;
    }
  }
}

// 웹 컴포넌트 등록
customElements.define('journal-editor', JournalEditor); 