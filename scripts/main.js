import { supabase, isUserLoggedIn } from '../utils/supabase.js';
import { subscribeToNewsletter } from '../utils/email.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Hero section card click events
    const credentialItems = document.querySelectorAll('.credential-item');
    
    // 인라인 onclick 속성 대신 JavaScript로 이벤트 핸들러 추가
    credentialItems.forEach(card => {
        card.addEventListener('click', function() {
            // 카드의 인덱스에 따라 다른 페이지로 이동 (완전한 URL 사용)
            const index = Array.from(credentialItems).indexOf(this);
            const baseUrl = window.location.origin; // 현재 도메인 가져오기
            switch(index) {
                case 0:
                    window.location.href = baseUrl + '/content/origin.html';
                    break;
                case 1:
                    window.location.href = baseUrl + '/content/depth.html';
                    break;
                case 2:
                    window.location.href = baseUrl + '/content/extension.html';
                    break;
            }
        });
    });

    // 제품 카드 클릭 이벤트
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 버튼 클릭은 제외 (버튼 클릭은 기본 동작 유지)
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                return;
            }
            
            // 카드 내부의 버튼 찾기
            const btn = this.querySelector('.btn');
            if (btn) {
                // 버튼의 href 속성 가져오기
                const href = btn.getAttribute('href');
                if (href) {
                    // href가 상대 경로인 경우 절대 경로로 변환
                    if (href.startsWith('pillars/')) {
                        window.location.href = '/' + href;  // 절대 경로로 변환
                    } else if (href.includes('pillars/')) {
                        // ../pillars/ 형태의 경로를 /pillars/로 변환
                        const pillarsIndex = href.indexOf('pillars/');
                        window.location.href = '/' + href.substring(pillarsIndex);  // 절대 경로로 변환
                    } else {
                        window.location.href = href;
                    }
                }
            }
        });
    });

    // 인증 모달 관련 코드
    const authModal = document.querySelector('auth-modal');
    const authButton = document.querySelector('auth-button');
    const authPlaceholder = document.querySelector('.auth-button-placeholder');
    
    // 인증 버튼 클릭 이벤트
    if (authButton) {
        authButton.addEventListener('authButtonClick', function(e) {
            if (authModal) {
                authModal.open();
            }
        });
    }
    
    // 인증 버튼 플레이스홀더 클릭 이벤트 (커스텀 엘리먼트가 로드되지 않았을 경우)
    if (authPlaceholder) {
        authPlaceholder.addEventListener('click', function() {
            if (authModal) {
                authModal.open();
            }
        });
    }
    
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auth')) {
        const authParam = urlParams.get('auth');
        if (authParam === 'signup' && authModal) {
            authModal.open('signup'); // 회원가입 모달 열기
        } else if (authParam === 'login' && authModal) {
            authModal.open('login'); // 로그인 모달 열기
        }
    }

    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    const emailInput = document.querySelector('.newsletter-input');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            if (email && isValidEmail(email)) {
                // 로딩 표시
                const submitBtn = this.querySelector('.btn');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Subscribing...';
                
                try {
                    // Supabase를 통한 뉴스레터 구독
                    const { success, message, error } = await subscribeToNewsletter(email);
                    
                    if (error) throw error;
                    
                    if (success) {
                        showMessage(message || 'Thank you for subscribing!', 'success');
                        emailInput.value = '';
                    }
                } catch (error) {
                    console.error('구독 에러:', error);
                    showMessage('Subscription failed. Please try again later.', 'error');
                } finally {
                    // 버튼 상태 복원
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } else {
                showMessage('Please enter a valid email address.', 'error');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    document.querySelectorAll('.topic-card, .credential-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // 로그인 상태 확인
    const isLoggedIn = await isUserLoggedIn();
    
    // 저널 모달 기능
    const journalModal = document.getElementById('journalModal');
    const journalBtns = document.querySelectorAll('.journal-btn');
    const journalClose = document.querySelector('.journal-close');
    
    // 저널 버튼 클릭 이벤트
    if (journalBtns.length > 0) {
        journalBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                // 기존 방식대로 저널 모달 열기
                if (journalModal) {
                    journalModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });
    }
    
    // 저널 모달 닫기
    if (journalClose) {
        journalClose.addEventListener('click', function() {
            journalModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // 모달 외부 클릭 시 닫기
    if (journalModal) {
        journalModal.addEventListener('click', function(e) {
            if (e.target === journalModal) {
                journalModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // 저널 저장 기능
    const saveJournalBtn = document.getElementById('saveJournal');
    const clearJournalBtn = document.getElementById('clearJournal');
    const journalTextarea = document.querySelector('.journal-textarea');
    const journalEntries = document.getElementById('journalEntries');

    if (saveJournalBtn && journalTextarea) {
        saveJournalBtn.addEventListener('click', function() {
            const entryText = journalTextarea.value.trim();
            if (entryText) {
                saveJournalEntry(entryText);
                journalTextarea.value = '';
                loadJournalEntries();
            }
        });
    }

    if (clearJournalBtn && journalTextarea) {
        clearJournalBtn.addEventListener('click', function() {
            journalTextarea.value = '';
        });
    }

    // 저널 항목 로드
    function loadJournalEntries() {
        if (!journalEntries) return;
        
        const entries = getJournalEntries();
        journalEntries.innerHTML = '';
        
        if (entries.length === 0) {
            journalEntries.innerHTML = '<div class="journal-empty">No entries yet. Start recording your thoughts!</div>';
            return;
        }
        
        entries.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'journal-entry';
            
            const dateElement = document.createElement('div');
            dateElement.className = 'entry-date';
            dateElement.textContent = new Date(entry.date).toLocaleDateString();
            
            const textElement = document.createElement('div');
            textElement.className = 'entry-text';
            textElement.textContent = entry.text;
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'entry-delete';
            deleteButton.textContent = '×';
            deleteButton.addEventListener('click', function() {
                deleteJournalEntry(index);
                loadJournalEntries();
            });
            
            entryElement.appendChild(dateElement);
            entryElement.appendChild(textElement);
            entryElement.appendChild(deleteButton);
            journalEntries.appendChild(entryElement);
        });
    }

    // 저널 항목 저장
    function saveJournalEntry(text) {
        const entries = getJournalEntries();
        entries.unshift({
            text: text,
            date: new Date().toISOString()
        });
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    // 저널 항목 삭제
    function deleteJournalEntry(index) {
        const entries = getJournalEntries();
        entries.splice(index, 1);
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    // 저널 항목 가져오기
    function getJournalEntries() {
        const entries = localStorage.getItem('journalEntries');
        return entries ? JSON.parse(entries) : [];
    }

    // 초기 저널 항목 로드
    loadJournalEntries();
});

// 이메일 유효성 검사
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).toLowerCase());
}

// 메시지 표시
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        font-weight: 500;
        z-index: 1000;
        transition: all 0.3s ease;
        ${type === 'success' ? 
            'background: #4CAF50; color: white; border: 1px solid #45a049;' : 
            'background: #f44336; color: white; border: 1px solid #da190b;'
        }
    `;
    
    document.body.appendChild(messageEl);
    
    // 3초 후 메시지 숨기기
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
} 