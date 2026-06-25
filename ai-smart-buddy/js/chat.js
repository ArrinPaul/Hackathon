/**
 * Chat Module - AI Chat Assistant
 */

class ChatManager {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        this.container = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');

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
            this.addMessage('assistant', 'API key is not configured.');
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
        const messageHtml = `
            <div class="message ${role}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">${this.formatMessage(content)}</div>
            </div>`;

        this.container.insertAdjacentHTML('beforeend', messageHtml);
        this.container.scrollTop = this.container.scrollHeight;
    }

    addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const html = `
            <div class="message assistant" id="${id}">
                <div class="message-avatar">🧠</div>
                <div class="message-content">
                    <span class="loading"></span> Thinking...
                </div>
            </div>`;
        this.container.insertAdjacentHTML('beforeend', html);
        this.container.scrollTop = this.container.scrollHeight;
        return id;
    }

    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    formatMessage(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^- (.*)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\s*<ul>/g, '');
    }
}

const chatManager = new ChatManager();
