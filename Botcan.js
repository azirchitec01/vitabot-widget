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
        /* ... toutes vos styles existantes inchangées ... */
    `;
    document.head.appendChild(widgetStyles);

    // Default config
    const defaultSettings = { webhook:{url:'',route:''}, branding:{logo:'',name:'',welcomeText:'Bienvenue',responseTimeText:'Réponse sous quelques secondes',poweredBy:{text:'Powered by n8n',link:'https://n8n.partnerlinks.io/fabimarkl'}}, style:{primaryColor:'#10b981',secondaryColor:'#059669',position:'right',backgroundColor:'#ffffff',fontColor:'#1f2937'}, suggestedQuestions:[] };
    const settings = window.ChatWidgetConfig ? {
        webhook:{...defaultSettings.webhook,...window.ChatWidgetConfig.webhook},
        branding:{...defaultSettings.branding,...window.ChatWidgetConfig.branding},
        style:{...defaultSettings.style,...window.ChatWidgetConfig.style, primaryColor:window.ChatWidgetConfig.style?.primaryColor==='\u0023854fff'?'#10b981':(window.ChatWidgetConfig.style?.primaryColor||'#10b981'), secondaryColor:window.ChatWidgetConfig.style?.secondaryColor==='\u00236b3fd4'?'#059669':(window.ChatWidgetConfig.style?.secondaryColor||'#059669')},
        suggestedQuestions:window.ChatWidgetConfig.suggestedQuestions||[]
    } : defaultSettings;

    // Create widget root
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    widgetRoot.style.setProperty('--chat-widget-primary',settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary',settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface',settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text',settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position==='left'?'left-side':'right-side'}`;

    // Single definitions of HTML templates with French texts
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
            <h2 class="registration-title">Veuillez entrer vos coordonnées</h2>
            <form class="registration-form">
                <div class="form-field">
                    <label for="chat-user-name" class="form-label">Nom & Prénom</label>
                    <input type="text" id="chat-user-name" class="form-input" placeholder="Votre nom et prénom" required>
                    <div class="error-text" id="name-error"></div>
                </div>
                <div class="form-field">
                    <label for="chat-user-email" class="form-label">Adresse email</label>
                    <input type="email" id="chat-user-email" class="form-input" placeholder="Votre adresse email" required>
                    <div class="error-text" id="email-error"></div>
                </div>
                <div class="form-field">
                    <label for="chat-user-whatsapp" class="form-label">WhatsApp</label>
                    <input type="tel" id="chat-user-whatsapp" class="form-input" placeholder="Votre numéro WhatsApp" required>
                    <div class="error-text" id="whatsapp-error"></div>
                </div>
                <button type="submit" class="submit-registration">Démarrer le chat</button>
            </form>
        </div>
    `;

    const chatInterfaceHTML = `
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="Tapez votre message ici..." rows="1"></textarea>
                <button class="chat-submit">
                    <!-- icône SVG -->
                </button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;
    widgetRoot.appendChild(chatWindow);

    // Launcher button
    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position==='left'?'left-side':'right-side'}`;
    launchButton.innerHTML = `<span class="chat-launcher-text">Besoin d'aide ?</span>`;
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    // DOM queries
    const startChatButton = chatWindow.querySelector('.chat-start-btn');
    const registrationForm = chatWindow.querySelector('.registration-form');
    const nameInput = chatWindow.querySelector('#chat-user-name');
    const emailInput = chatWindow.querySelector('#chat-user-email');
    const whatsappInput = chatWindow.querySelector('#chat-user-whatsapp');
    const nameError = chatWindow.querySelector('#name-error');
    const emailError = chatWindow.querySelector('#email-error');
    const whatsappError = chatWindow.querySelector('#whatsapp-error');
    const chatBody = chatWindow.querySelector('.chat-body');
    const sendButton = chatWindow.querySelector('.chat-submit');
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');

    function createSessionId() { return crypto.randomUUID(); }
    function createTypingIndicator() { const d=document.createElement('div'); d.className='typing-indicator'; d.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>'; return d; }
    function linkifyText(t) { return t.replace(/(https?:\/\/[\w.\/\?=&-]+)/g, u => `<a href="${u}" target="_blank" class="chat-link">${u}</a>`); }
    function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
    function showRegistrationForm() { chatWindow.querySelector('.chat-welcome').style.display='none'; chatWindow.querySelector('.user-registration').classList.add('active'); }

    async function handleRegistration(evt) {
        evt.preventDefault(); [nameError,emailError,whatsappError].forEach(e=>e.textContent=''); [nameInput,emailInput,whatsappInput].forEach(i=>i.classList.remove('error'));
        let valid=true; const n=nameInput.value.trim(), em=emailInput.value.trim(), wa=whatsappInput.value.trim();
        if(!n){nameError.textContent='Veuillez entrer votre nom';nameInput.classList.add('error');valid=false;} if(!em){emailError.textContent='Veuillez entrer votre email';emailInput.classList.add('error');valid=false;}else if(!isValidEmail(em)){emailError.textContent='Email invalide';emailInput.classList.add('error');valid=false;} if(!wa){whatsappError.textContent='Veuillez entrer votre WhatsApp';whatsappInput.classList.add('error');valid=false;} if(!valid) return;
        const sid=createSessionId(); conversationId=sid;
        const sessionData=[{action:'loadPreviousSession',sessionId:sid,route:settings.webhook.route,metadata:{userId:em,userName:n,whatsapp:wa}}];
        registrationForm.closest('.user-registration').classList.remove('active'); chatBody.classList.add('active'); const ind=createTypingIndicator(); messagesContainer.appendChild(ind);
        try{ await fetch(settings.webhook.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sessionData)});
            const msg=`Nom : ${n}\nEmail : ${em}\nWhatsApp : ${wa}`;
            const payload={action:'sendMessage',sessionId:sid,route:settings.webhook.route,chatInput:msg,metadata:{userId:em,userName:n,whatsapp:wa,isUserInfo:true}};
            const resp=await fetch(settings.webhook.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const data=await resp.json();
            messagesContainer.removeChild(ind);
            const bubble=document.createElement('div');bubble.className='chat-bubble bot-bubble';bubble.innerHTML=linkifyText(Array.isArray(data)?data[0].output:data.output);messagesContainer.appendChild(bubble);
        }catch(err){console.error(err);} }

    async function submitMessage(txt){ if(isWaitingForResponse)return; isWaitingForResponse=true;
        const meta={userId:emailInput.value.trim(),userName:nameInput.value.trim(),whatsapp:whatsappInput.value.trim()};
        const payload={action:'sendMessage',sessionId:conversationId,route:settings.webhook.route,chatInput:txt,metadata:meta};
        const userB=document.createElement('div');userB.className='chat-bubble user-bubble';userB.textContent=txt;messagesContainer.appendChild(userB);
        const ind=createTypingIndicator();messagesContainer.appendChild(ind);
        try{ const resp=await fetch(settings.webhook.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const d=await resp.json(); messagesContainer.removeChild(ind);
            const botB=document.createElement('div');botB.className='chat-bubble bot-bubble';botB.innerHTML=linkifyText(Array.isArray(d)?d[0].output:d.output);messagesContainer.appendChild(botB);
        }catch(err){console.error(err);} finally{isWaitingForResponse=false;} }

    sendButton.addEventListener('click',()=>{const t=messageTextarea.value.trim();if(t){submitMessage(t);messageTextarea.value='';messageTextarea.style.height='auto';}});
    messageTextarea.addEventListener('input',()=>{messageTextarea.style.height='auto';messageTextarea.style.height=Math.min(messageTextarea.scrollHeight,120)+'px';});
    startChatButton.addEventListener('click',showRegistrationForm);
    registrationForm.addEventListener('submit',handleRegistration);
    launchButton.addEventListener('click',()=>chatWindow.classList.toggle('visible'));
    chatWindow.querySelectorAll('.chat-close-btn').forEach(b=>b.addEventListener('click',()=>chatWindow.classList.remove('visible')));
})();
