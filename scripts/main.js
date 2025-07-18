document.addEventListener('DOMContentLoaded', function() {
    // Hero section card click events
    const originCard = document.querySelector('.credential-item:nth-child(1)');
    const depthCard = document.querySelector('.credential-item:nth-child(2)');
    const extensionCard = document.querySelector('.credential-item:nth-child(3)');

    if (originCard) {
        originCard.addEventListener('click', function() {
            window.location.href = 'content/origin.html';
        });
    }

    if (depthCard) {
        depthCard.addEventListener('click', function() {
            window.location.href = 'content/depth.html';
        });
    }

    if (extensionCard) {
        extensionCard.addEventListener('click', function() {
            window.location.href = 'content/extension.html';
        });
    }

    // Content structure cards click events removed

    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    const emailInput = document.querySelector('.newsletter-input');
    const subscribeBtn = document.querySelector('.newsletter-form .btn');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            if (email && isValidEmail(email)) {
                // Here you would typically send the email to your server
                showMessage('Thank you for subscribing!', 'success');
                emailInput.value = '';
            } else {
                showMessage('Please enter a valid email address.', 'error');
            }
        });
    }

    // Click handler for subscribe button
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function(e) {
            if (e.target.closest('.newsletter-form')) {
                e.preventDefault();
                const event = new Event('submit');
                newsletterForm.dispatchEvent(event);
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
    document.querySelectorAll('.topic-card, .product-card, .credential-item, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Message display function
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message element
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

        // Auto remove after 3 seconds
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

    // Add hover effects to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add counter animation for stats
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target === Infinity ? '∞' : Math.floor(target) + '+';
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start) + '+';
            }
        }, 16);
    }

    // Trigger counter animation when stats section is visible
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(num => {
                    const text = num.textContent;
                    if (text === '∞') {
                        // Special case for infinity symbol
                        num.style.opacity = '0';
                        setTimeout(() => {
                            num.style.transition = 'opacity 0.5s ease';
                            num.style.opacity = '1';
                        }, 1000);
                    } else {
                        const value = parseInt(text.replace(/[^\d]/g, ''));
                        num.textContent = '0+';
                        animateCounter(num, value);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
    
    // Journal Modal Functionality
    const journalModal = document.getElementById('journalModal');
    const journalBtns = document.querySelectorAll('.journal-btn');
    const journalClose = document.querySelector('.journal-close');
    const journalTextarea = document.querySelector('.journal-textarea');
    const clearJournalBtn = document.getElementById('clearJournal');
    const saveJournalBtn = document.getElementById('saveJournal');
    const journalEntries = document.getElementById('journalEntries');

    // Open journal modal
    journalBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            journalModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            loadJournalEntries();
        });
    });

    // Close journal modal
    if (journalClose) {
        journalClose.addEventListener('click', function() {
            journalModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal on outside click
    journalModal.addEventListener('click', function(e) {
        if (e.target === journalModal) {
            journalModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Clear journal entry
    if (clearJournalBtn) {
        clearJournalBtn.addEventListener('click', function() {
            journalTextarea.value = '';
        });
    }

    // Save journal entry
    if (saveJournalBtn) {
        saveJournalBtn.addEventListener('click', function() {
            const journalText = journalTextarea.value.trim();
            if (journalText) {
                saveJournalEntry(journalText);
                journalTextarea.value = '';
                showMessage('Your thoughts have been saved.', 'success');
                loadJournalEntries();
            } else {
                showMessage('Please enter your thoughts before saving.', 'error');
            }
        });
    }

    // Save journal entry to localStorage
    function saveJournalEntry(text) {
        const entry = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            prompt: document.getElementById('journalPrompt').textContent,
            text: text
        };

        let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.unshift(entry);
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    // Load journal entries from localStorage
    function loadJournalEntries() {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        
        if (entries.length === 0) {
            journalEntries.innerHTML = '<div class="journal-empty">No entries yet. Start recording your thoughts!</div>';
            return;
        }

        journalEntries.innerHTML = '';
        
        entries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'journal-entry';
            entryEl.innerHTML = `
                <div class="journal-entry-header">
                    <span class="journal-entry-date">${entry.date} at ${entry.time}</span>
                    <button class="journal-entry-delete" data-id="${entry.id}">&times;</button>
                </div>
                <div class="journal-entry-content">${entry.text}</div>
            `;
            journalEntries.appendChild(entryEl);
        });

        // Add delete functionality
        document.querySelectorAll('.journal-entry-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteJournalEntry(id);
            });
        });
    }

    // Delete journal entry
    function deleteJournalEntry(id) {
        let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('journalEntries', JSON.stringify(entries));
        loadJournalEntries();
        showMessage('Entry deleted.', 'success');
    }

    // Subscription Modal Functionality
    const subscriptionModal = document.getElementById('subscriptionModal');
    const subscribeBtns = document.querySelectorAll('.subscribe-btn');
    const subscriptionClose = document.querySelector('.subscription-close');
    const subscriptionPlans = document.querySelectorAll('.subscription-plan');
    const subscribeButton = document.getElementById('subscribeButton');
    const subscriptionForm = document.getElementById('subscriptionForm');
    const subscriptionSuccess = document.getElementById('subscriptionSuccess');
    const closeSuccessButton = document.getElementById('closeSuccessButton');

    // Open subscription modal
    subscribeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            subscriptionModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close subscription modal
    if (subscriptionClose) {
        subscriptionClose.addEventListener('click', function() {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal on outside click
    subscriptionModal.addEventListener('click', function(e) {
        if (e.target === subscriptionModal) {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Select subscription plan
    subscriptionPlans.forEach(plan => {
        plan.addEventListener('click', function() {
            subscriptionPlans.forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Set default selected plan
    if (subscriptionPlans.length > 0) {
        subscriptionPlans[0].classList.add('selected');
    }

    // Process subscription
    if (subscribeButton) {
        subscribeButton.addEventListener('click', function() {
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const cardNumber = document.getElementById('cardNumber').value.trim();
            const expiry = document.getElementById('expiry').value.trim();
            const cvv = document.getElementById('cvv').value.trim();

            if (!fullName || !email || !cardNumber || !expiry || !cvv) {
                showMessage('Please fill in all required fields.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address.', 'error');
                return;
            }

            // In a real implementation, you would process the payment here
            // For now, we'll just show the success message
            subscriptionForm.style.display = 'none';
            subscriptionSuccess.classList.add('active');
        });
    }

    // Close success message
    if (closeSuccessButton) {
        closeSuccessButton.addEventListener('click', function() {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset form for next time
            setTimeout(() => {
                subscriptionForm.style.display = '';
                subscriptionSuccess.classList.remove('active');
            }, 500);
        });
    }
}); 