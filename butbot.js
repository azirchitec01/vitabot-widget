(function () {
  if (window.ButBotLoaded) return;
  window.ButBotLoaded = true;

  // Load font
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap';
  document.head.appendChild(font);

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    .butbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-family: 'Poppins', sans-serif;
      z-index: 9999;
    }
    .butbot-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 30px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .butbot-chatbox {
      display: none;
      flex-direction: column;
      background: #ffffff;
      width: 340px;
      height: 480px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      margin-bottom: 10px;
    }
    .butbot-header {
      background: #10b981;
      padding: 16px;
      color: white;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
    }
    .butbot-body {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      display: none;
    }
    .butbot-input {
      display: none;
      border-top: 1px solid #ddd;
    }
    .butbot-input textarea {
      flex: 1;
      padding: 10px;
      border: none;
      resize: none;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
    }
    .butbot-input button {
      background: #10b981;
      border: none;
      color: white;
      padding: 0 16px;
      cursor: pointer;
    }
    .butbot-msg.user {
      text-align: right;
      margin: 4px 0;
      background: #dcfce7;
      padding: 8px 12px;
      border-radius: 12px 12px 0 12px;
      display: inline-block;
    }
    .butbot-msg.bot {
      text-align: left;
      margin: 4px 0;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 12px 12px 12px 0;
      display: inline-block;
    }
    .butbot-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .butbot-form input {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }
    .butbot-form button {
      background: #10b981;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // HTML Structure
  const container = document.createElement('div');
  container.className = 'butbot-container';
  container.innerHTML = `
    <div class="butbot-chatbox">
      <div class="butbot-header">👋 Bienvenue !</div>
      <div class="butbot-form" id="butbot-form">
        <input type="text" id="butbot-name" placeholder="Votre nom complet" required>
        <input type="email" id="butbot-email" placeholder="Votre adresse email" required>
        <input type="tel" id="butbot-phone" placeholder="Votre numéro WhatsApp" required>
        <button id="butbot-start">Démarrer</button>
      </div>
      <div class="butbot-body" id="butbot-messages"></div>
      <div class="butbot-input">
        <textarea id="butbot-input" placeholder="Tapez votre message ici..." rows="1"></textarea>
        <button id="butbot-send">➤</button>
      </div>
    </div>
    <div class="butbot-bubble" id="butbot-toggle">💬</div>
  `;
  document.body.appendChild(container);

  // Elements
  const toggle = document.getElementById('butbot-toggle');
  const chatbox = container.querySelector('.butbot-chatbox');
  const form = document.getElementById('butbot-form');
  const nameInput = document.getElementById('butbot-name');
  const emailInput = document.getElementById('butbot-email');
  const phoneInput = document.getElementById('butbot-phone');
  const startBtn = document.getElementById('butbot-start');
  const input = document.getElementById('butbot-input');
  const sendBtn = document.getElementById('butbot-send');
  const messages = document.getElementById('butbot-messages');
  const chatBody = document.querySelector('.butbot-body');
  const inputBox = document.querySelector('.butbot-input');

  let user = {
    name: null,
    email: null,
    phone: null
  };

  toggle.onclick = () => {
    chatbox.style.display = chatbox.style.display === 'flex' ? 'none' : 'flex';
  };

  function appendMessage(text, sender = 'user') {
    const msg = document.createElement('div');
    msg.className = `butbot-msg ${sender}`;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    input.value = '';

    fetch('https://flow.vitacucina.ma/webhook/vitabot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        phone: user.phone,
        message: text
      })
    })
      .then(res => res.json())
      .then(data => {
        appendMessage(data.reply || "Merci pour votre message !", 'bot');
      })
      .catch(() => {
        appendMessage("Erreur de connexion.", 'bot');
      });
  }

  startBtn.onclick = () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !email || !phone) {
      alert("Merci de remplir tous les champs.");
      return;
    }

    user.name = name;
    user.email = email;
    user.phone = phone;

    form.style.display = 'none';
    chatBody.style.display = 'block';
    inputBox.style.display = 'flex';

    appendMessage(`Bonjour ${user.name}, comment puis-je vous aider ?`, 'bot');
  };

  sendBtn.onclick = sendMessage;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
