/**
 * AI Service - Handles communication with Groq API
 * Free tier: 14,400 requests/day
 * Get API key: https://console.groq.com
 */

class AIService {
    constructor() {
        this.apiKeyStorageKey = 'groq_api_key';
        this.modelStorageKey = 'groq_model';
        this.apiKey = '';
        this.model = 'openai/gpt-oss-120b';
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.loadConfig();
    }

    loadConfig() {
        const runtimeConfig = window.__AI_SMART_BUDDY_CONFIG__ || {};
        const storedApiKey = localStorage.getItem(this.apiKeyStorageKey) || '';
        const storedModel = localStorage.getItem(this.modelStorageKey) || '';

        this.apiKey = runtimeConfig.groqApiKey || storedApiKey || '';
        this.model = runtimeConfig.groqModel || storedModel || 'openai/gpt-oss-120b';
        this.baseUrl = runtimeConfig.groqBaseUrl || 'https://api.groq.com/openai/v1/chat/completions';
    }

    saveConfig({ apiKey, model } = {}) {
        if (typeof apiKey === 'string') {
            const trimmedKey = apiKey.trim();
            this.apiKey = trimmedKey;
            localStorage.setItem(this.apiKeyStorageKey, trimmedKey);
        }

        if (typeof model === 'string' && model.trim()) {
            const trimmedModel = model.trim();
            this.model = trimmedModel;
            localStorage.setItem(this.modelStorageKey, trimmedModel);
        }
    }

    clearConfig() {
        this.apiKey = '';
        this.model = 'openai/gpt-oss-120b';
        localStorage.removeItem(this.apiKeyStorageKey);
        localStorage.removeItem(this.modelStorageKey);
    }

    isConnected() {
        this.loadConfig();
        return this.apiKey.length > 0;
    }

    async generate(systemPrompt, userPrompt, temperature = 0.7) {
        if (!this.isConnected()) {
            throw new Error('API key is not configured.');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: temperature,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response from AI. Please try again.');
            }
            return data.choices[0].message.content;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }

    async chat(messages, temperature = 0.7) {
        if (!this.isConnected()) {
            throw new Error('API key is not configured.');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response from AI. Please try again.');
            }
            return data.choices[0].message.content;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }
}

// Export singleton instance
const aiService = new AIService();
