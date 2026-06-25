class ChatManager {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        this.container = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');

        if (!this.container || !this.input || !this.sendBtn) return;

        this.sendBtn.addEventListener('click', () => this.send());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
    }

    async send() {
        const text = this.input.value.trim();
        if (!text) return;

        if (!aiService.isConnected()) {
            this.showError('API key is not configured. Please add your Groq API key.');
            return;
        }

        this.addMessage('user', text);
        this.input.value = '';
        this.sendBtn.disabled = true;

        const typingId = this.addTypingIndicator();

        try {
            const systemPrompt = `You are an AI study assistant for a college student. You help with:
- Study tips and techniques
- Explaining concepts
- Creating study schedules
- Summarizing notes
- Answering academic questions
- Time management advice

Be friendly, concise, and helpful. Use emojis occasionally.
If the student asks about tasks or deadlines, suggest they use the Smart Tools section.`;

            const chatMessages = [
                { role: 'system', content: systemPrompt },
                ...this.messages.slice(-10).map(m => ({
                    role: m.role,
                    content: m.content
                })),
            ];

            const response = await aiService.chat(chatMessages);
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', response);
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error: ' + error.message);
        } finally {
            this.sendBtn.disabled = false;
        }
    }

    addMessage(role, content) {
        this.messages.push({ role, content });

        const avatar = role === 'assistant' ? '🧠' : '👤';
        const copyBtn = role === 'assistant'
            ? `<button class="message-copy-btn" onclick="chatManager.copyMessage(this)" data-text="${this.escapeAttr(content)}">Copy</button>`
            : '';

        const messageEl = document.createElement('div');
        messageEl.className = `message ${role}`;
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div>
                <div class="message-content">${this.formatMessage(content)}</div>
                ${copyBtn}
            </div>`;

        this.container.appendChild(messageEl);
        this.container.scrollTop = this.container.scrollHeight;
    }

    copyMessage(btn) {
        const text = btn.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(() => {
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = original; }, 1500);
        }).catch(() => {
            btn.textContent = 'Failed';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        });
    }

    addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const el = document.createElement('div');
        el.className = 'message assistant';
        el.id = id;
        el.innerHTML = `
            <div class="message-avatar">🧠</div>
            <div class="message-content">
                <span class="loading"></span> Thinking...
            </div>`;
        this.container.appendChild(el);
        this.container.scrollTop = this.container.scrollHeight;
        return id;
    }

    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    showError(message) {
        const existing = this.container.querySelector('.inline-error');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'inline-error';
        el.textContent = message;
        this.container.appendChild(el);
        this.container.scrollTop = this.container.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttr(text) {
        return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    formatMessage(text) {
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        escaped = escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');

        const lines = escaped.split('\n');
        let result = '';
        let inList = false;

        for (const line of lines) {
            if (line.match(/^- /)) {
                if (!inList) {
                    result += '<ul>';
                    inList = true;
                }
                result += `<li>${line.slice(2)}</li>`;
            } else {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                if (line.trim()) {
                    result += `<p>${line}</p>`;
                }
            }
        }

        if (inList) result += '</ul>';
        return result;
    }
}

const chatManager = new ChatManager();
