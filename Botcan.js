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

    // Apply widget styles
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        /* ... (toute votre feuille de styles existante reste inchangée) ... */
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration
    const defaultSettings = {
        webhook: { url: '', route: '' },
        branding: {
            logo: '', name: '', welcomeText: '', responseTimeText: '',
            poweredBy: { text: 'Powered by n8n', link: 'https://n8n.partnerlinks.io/fabimarkl' }
        },
        style: {
            primaryColor: '#10b981', secondaryColor: '#059669',
            position: 'right', backgroundColor: '#ffffff', fontColor: '#1f2937'
        },
        suggestedQuestions: []
    };
    const settings = window.ChatWidgetConfig
        ? {
            webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
            style: {
                ...defaultSettings.style, ...window.ChatWidgetConfig.style,
                primaryColor: window.ChatWidgetConfig.style?.primaryColor === '#854fff' ? '#10b981' : (window.ChatWidgetConfig.style?.primaryColor || '#10b981'),
                secondaryColor: window.ChatWidgetConfig.style?.secondaryColor === '#6b3fd4' ? '#059669' : (window.ChatWidgetConfig.style?.secondaryColor || '#059669')
            },
            suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || []
        }
        : defaultSettings;

    // Session tracking
    let conversationId = '';
    let isWaitingForResponse = false;

    // Create widget DOM
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-tertiary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // --- Voici votre welcomeScreenHTML **mis à jour** avec le champ WhatsApp ---
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
                <button class="chat-submit">…</button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;

    // Toggle button
    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `<svg>…</svg><span class="chat-launcher-text">Chat</span>`;

    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    // Grab elements
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
    function createTypingIndicator() { /* … */ }
    function linkifyText(text) { /* … */ }
    function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

    // Show registration
    function showRegistrationForm() {
        chatWelcome.style.display = 'none';
        userRegistration.classList.add('active');
    }

    // Handle registration
    async function handleRegistration(event) {
        event.preventDefault();
        // reset errors
        [nameError, emailError, whatsappError].forEach(e => e.textContent = '');
        [nameInput, emailInput, whatsappInput].forEach(i => i.classList.remove('error'));

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        let isValid = true;

        if (!name) {
            nameError.textContent = 'Veuillez entrer votre nom';
            nameInput.classList.add('error');
            isValid = false;
        }
        if (!email) {
            emailError.textContent = 'Veuillez entrer votre email';
            emailInput.classList.add('error');
            isValid = false;
        } else if (!isValidEmail(email)) {
            emailError.textContent = 'Adresse email invalide';
            emailInput.classList.add('error');
            isValid = false;
        }
        if (!whatsapp) {
            whatsappError.textContent = 'Veuillez entrer votre numéro WhatsApp';
            whatsappInput.classList.add('error');
            isValid = false;
        }

        if (!isValid) return;

        conversationId = createSessionId();

        const sessionData = [{
            action: "loadPreviousSession",
            sessionId: conversationId,
            route: settings.webhook.route,
            metadata: { userId: email, userName: name, whatsapp }
        }];

        try {
            userRegistration.classList.remove('active');
            chatBody.classList.add('active');

            const typingIndicator = createTypingIndicator();
            messagesContainer.appendChild(typingIndicator);

            // load session
            const resp1 = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(sessionData)
            });
            await resp1.json();

            // send user info
            const userInfoMessage = `Name: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}`;
            const userInfoData = {
                action: "sendMessage",
                sessionId: conversationId,
                route: settings.webhook.route,
                chatInput: userInfoMessage,
                metadata: { userId: email, userName: name, whatsapp, isUserInfo: true }
            };
            const resp2 = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(userInfoData)
            });
            const userInfoResponseData = await resp2.json();

            messagesContainer.removeChild(typingIndicator);

            // display bot response
            const botMessage = document.createElement('div');
            botMessage.className = 'chat-bubble bot-bubble';
            const text = Array.isArray(userInfoResponseData) 
                ? userInfoResponseData[0].output 
                : userInfoResponseData.output;
            botMessage.innerHTML = linkifyText(text);
            messagesContainer.appendChild(botMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // suggested questions
            if (settings.suggestedQuestions.length) {
                const sq = document.createElement('div');
                sq.className = 'suggested-questions';
                settings.suggestedQuestions.forEach(q => {
                    const btn = document.createElement('button');
                    btn.className = 'suggested-question-btn';
                    btn.textContent = q;
                    btn.onclick = () => {
                        submitMessage(q);
                        sq.remove();
                    };
                    sq.appendChild(btn);
                });
                messagesContainer.appendChild(sq);
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Send a chat message
    async function submitMessage(messageText) {
        if (isWaitingForResponse) return;
        isWaitingForResponse = true;

        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        const whatsapp = whatsappInput.value.trim();

        const requestData = {
            action: "sendMessage",
            sessionId: conversationId,
            route: settings.webhook.route,
            chatInput: messageText,
            metadata: { userId: email, userName: name, whatsapp }
        };

        // display user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user-bubble';
        userBubble.textContent = messageText;
        messagesContainer.appendChild(userBubble);

        const typingIndicator = createTypingIndicator();
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const resp = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(requestData)
            });
            const data = await resp.json();

            messagesContainer.removeChild(typingIndicator);

            const botBubble = document.createElement('div');
            botBubble.className = 'chat-bubble bot-bubble';
            const txt = Array.isArray(data) ? data[0].output : data.output;
            botBubble.innerHTML = linkifyText(txt);
            messagesContainer.appendChild(botBubble);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (err) {
            console.error(err);
        } finally {
            isWaitingForResponse = false;
        }
    }

    // Auto‑resize textarea
    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = Math.min(messageTextarea.scrollHeight, 120) + 'px';
    }

    // Event listeners
    startChatButton.addEventListener('click', showRegistrationForm);
    registrationForm.addEventListener('submit', handleRegistration);
    sendButton.addEventListener('click', () => {
        const txt = messageTextarea.value.trim();
        if (txt) {
            submitMessage(txt);
            messageTextarea.value = '';
            messageTextarea.style.height = 'auto';
        }
    });
    messageTextarea.addEventListener('input', autoResizeTextarea);
    messageTextarea.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const txt = messageTextarea.value.trim();
            if (txt) {
                submitMessage(txt);
                messageTextarea.value = '';
                messageTextarea.style.height = 'auto';
            }
        }
    });
    launchButton.addEventListener('click', () => chatWindow.classList.toggle('visible'));
    chatWindow.querySelectorAll('.chat-close-btn').forEach(btn => btn.addEventListener('click', () => {
        chatWindow.classList.remove('visible');
    }));
})();
