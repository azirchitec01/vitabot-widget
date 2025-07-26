// Interactive Chat Widget for n8n
(function() {
    // Initialize widget only once
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    // Load font resource - using Poppins for a fresh look
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    // Apply widget styles with completely different design approach
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        .chat-assist-widget {
            --chat-color-primary: var(--chat-widget-primary, #10b981);
            --chat-color-secondary: var(--chat-widget-secondary, #059669);
            --chat-color-tertiary: var(--chat-widget-tertiary, #047857);
            --chat-color-light: var(--chat-widget-light, #d1fae5);
            --chat-color-surface: var(--chat-widget-surface, #ffffff);
            --chat-color-text: var(--chat-widget-text, #1f2937);
            --chat-color-text-light: var(--chat-widget-text-light, #6b7280);
            --chat-color-border: var(--chat-widget-border, #e5e7eb);
            --chat-shadow-sm: 0 1px 3px rgba(16, 185, 129, 0.1);
            --chat-shadow-md: 0 4px 6px rgba(16, 185, 129, 0.15);
            --chat-shadow-lg: 0 10px 15px rgba(16, 185, 129, 0.2);
            --chat-radius-sm: 8px;
            --chat-radius-md: 12px;
            --chat-radius-lg: 20px;
            --chat-radius-full: 9999px;
            --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: 'Poppins', sans-serif;
        }

        /* ... all existing styles unchanged ... */
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration
    const defaultSettings = {
        webhook: { url: '', route: '' },
        branding: {
            logo: '', name: '', welcomeText: '', responseTimeText: '',
            poweredBy: { text: 'Powered by n8n', link: 'https://n8n.partnerlinks.io/fabimarkl' }
        },
        style: { primaryColor: '#10b981', secondaryColor: '#059669', position: 'right', backgroundColor: '#ffffff', fontColor: '#1f2937' },
        suggestedQuestions: []
    };
    const settings = window.ChatWidgetConfig ? {
        webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
        style: {
            ...defaultSettings.style, ...window.ChatWidgetConfig.style,
            primaryColor: window.ChatWidgetConfig.style?.primaryColor === '#854fff' ? '#10b981' : (window.ChatWidgetConfig.style?.primaryColor || '#10b981'),
            secondaryColor: window.ChatWidgetConfig.style?.secondaryColor === '#6b3fd4' ? '#059669' : (window.ChatWidgetConfig.style?.secondaryColor || '#059669')
        },
        suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || []
    } : defaultSettings;

    // Session tracking
    let conversationId = '';
    let isWaitingForResponse = false;

    // Create widget DOM structure
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-tertiary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // Welcome screen with Name, Email, and WhatsApp
    const welcomeScreenHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="${settings.branding.name}">
            <span class="chat-header-title">${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
        <div class="chat-welcome">
            <h2 class="chat-welcome-title">${settings.branding.welcomeText}</h2>
            <button class="chat-start-btn">Commencez</button>
            <p class="chat-response-time">${settings.branding.responseTimeText}</p>
        </div>
        <div class="user-registration">
            <h2 class="registration-title">Envoyez vos coordonnées pour commencer</h2>
            <form class="registration-form">
                <div class="form-field">
                    <label class="form-label" for="chat-user-name">Name</label>
                    <input type="text" id="chat-user-name" class="form-input" placeholder="Your name" required>
                    <div class="error-text" id="name-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-email">Email</label>
                    <input type="email" id="chat-user-email" class="form-input" placeholder="Your email address" required>
                    <div class="error-text" id="email-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-whatsapp">WhatsApp</label>
                    <input type="tel" id="chat-user-whatsapp" class="form-input" placeholder="Votre numéro WhatsApp" required>
                    <div class="error-text" id="whatsapp-error"></div>
                </div>
                <button type="submit" class="submit-registration">Continue to Chat</button>
            </form>
        </div>
    `;

    const chatInterfaceHTML = `
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="Type your message here..." rows="1"></textarea>
                <button class="chat-submit">
                    <!-- SVG icon -->
                </button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;

    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `<svg><!-- icon --></svg><span class="chat-launcher-text">Chat</span>`;

    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    // DOM references
    const startChatButton = chatWindow.querySelector('.chat-start-btn');
    const chatBody = chatWindow.querySelector('.chat-body');
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');
    const sendButton = chatWindow.querySelector('.chat-submit');

    const registrationForm = chatWindow.querySelector('.registration-form');
    const userRegistration = chatWindow.querySelector('.user-registration');
    const chatWelcome = chatWindow.querySelector('.chat-welcome');
    const nameInput = chatWindow.querySelector('#chat-user-name');
    const emailInput = chatWindow.querySelector('#chat-user-email');
    const whatsappInput = chatWindow.querySelector('#chat-user-whatsapp');
    const nameError = chatWindow.querySelector('#name-error');
    const emailError = chatWindow.querySelector('#email-error');
    const whatsappError = chatWindow.querySelector('#whatsapp-error');

    // Helpers
    function createSessionId() { return crypto.randomUUID(); }
    function createTypingIndicator() {
        const div = document.createElement('div'); div.className = 'typing-indicator';
        div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        return div;
    }
    function linkifyText(text) { return text.replace(/(https?:\/\/[\w./?=&-]+)/g, url => `<a href="${url}" target="_blank" class="chat-link">${url}</a>`); }
    function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

    function showRegistrationForm() {
        chatWelcome.style.display = 'none';
        userRegistration.classList.add('active');
    }

    async function handleRegistration(event) {
        event.preventDefault();
        // Reset errors
        [nameError, emailError, whatsappError].forEach(e => e.textContent = '');
        [nameInput, emailInput, whatsappInput].forEach(i => i.classList.remove('error'));

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        let valid = true;
        if (!name) { nameError.textContent = 'Veuillez entrer votre nom'; nameInput.classList.add('error'); valid = false; }
        if (!email) {
            emailError.textContent = 'Veuillez entrer votre email'; emailInput.classList.add('error'); valid = false;
        } else if (!isValidEmail(email)) {
            emailError.textContent = 'Email invalide'; emailInput.classList.add('error'); valid = false;
        }
        if (!whatsapp) { whatsappError.textContent = 'Veuillez entrer votre numéro WhatsApp'; whatsappInput.classList.add('error'); valid = false; }
        if (!valid) return;

        conversationId = createSessionId();
        const sessionData = [{ action: 'loadPreviousSession', sessionId: conversationId, route: settings.webhook.route,
            metadata: { userId: email, userName: name, whatsapp }
        }];

        try {
            userRegistration.classList.remove('active');
            chatBody.classList.add('active');

            const indicator = createTypingIndicator();
            messagesContainer.appendChild(indicator);

            await fetch(settings.webhook.url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sessionData) });

            const infoMessage = `Name: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}`;
            const infoPayload = { action:'sendMessage', sessionId:conversationId, route:settings.webhook.route, chatInput:infoMessage,
                metadata:{ userId:email, userName:name, whatsapp, isUserInfo:true }
            };
            const resp = await fetch(settings.webhook.url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(infoPayload) });
            const data = await resp.json();

            messagesContainer.removeChild(indicator);
            const botBubble = document.createElement('div'); botBubble.className='chat-bubble bot-bubble';
            botBubble.innerHTML = linkifyText(Array.isArray(data)?data[0].output:data.output);
            messagesContainer.appendChild(botBubble);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch(err) {
            console.error(err);
        }
    }

    async function submitMessage(text) {
        if (isWaitingForResponse) return;
        isWaitingForResponse = true;
        const payload = { action:'sendMessage', sessionId:conversationId, route:settings.webhook.route, chatInput:text,
            metadata:{ userId: emailInput.value.trim(), userName: nameInput.value.trim(), whatsapp: whatsappInput.value.trim() }
        };
        const userBubble = document.createElement('div'); userBubble.className='chat-bubble user-bubble'; userBubble.textContent=text;
        messagesContainer.appendChild(userBubble);
        const indicator = createTypingIndicator(); messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const resp = await fetch(settings.webhook.url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            const resData = await resp.json();
            messagesContainer.removeChild(indicator);
            const botBubble = document.createElement('div'); botBubble.className='chat-bubble bot-bubble';
            botBubble.innerHTML = linkifyText(Array.isArray(resData)?resData[0].output:resData.output);
            messagesContainer.appendChild(botBubble);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch(err) {
            console.error(err);
        } finally { isWaitingForResponse = false; }
    }

    messageTextarea.addEventListener('input', () => {
        messageTextarea.style.height='auto';
        messageTextarea.style.height = Math.min(messageTextarea.scrollHeight,120)+'px';
    });

    startChatButton.addEventListener('click', showRegistrationForm);
    registrationForm.addEventListener('submit', handleRegistration);
    sendButton.addEventListener('click', () => {
        const msg = messageTextarea.value.trim(); if (!msg) return;
        submitMessage(msg);
        messageTextarea.value = ''; messageTextarea.style.height='auto';
    });
    messageTextarea.addEventListener('keypress', e => {
        if (e.key==='Enter' && !e.shiftKey) {
            e.preventDefault(); const t=messageTextarea.value.trim(); if (t) { submitMessage(t); messageTextarea.value=''; messageTextarea.style.height='auto'; }
        }
    });
    launchButton.addEventListener('click', () => chatWindow.classList.toggle('visible'));
    chatWindow.querySelectorAll('.chat-close-btn').forEach(btn=>btn.addEventListener('click',()=>chatWindow.classList.remove('visible')));
})();
