class FlashcardManager {
    constructor() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.init();
    }

    init() {
        this.stack = document.getElementById('flashcardStack');
        this.nav = document.getElementById('flashcardNav');
        this.counter = document.getElementById('cardCounter');
        this.generateBtn = document.getElementById('generateFlashcardsBtn');
        this.clearBtn = document.getElementById('clearFlashcardsBtn');
        this.prevBtn = document.getElementById('prevCardBtn');
        this.nextBtn = document.getElementById('nextCardBtn');
        this.flipBtn = document.getElementById('flipCardBtn');
        this.notesInput = document.getElementById('notesInput');
        this.progress = document.getElementById('flashcardProgress');
        this.progressFill = document.getElementById('flashcardProgressFill');
        this.hintText = document.getElementById('flashcardHintText');

        if (!this.generateBtn) return;

        this.generateBtn.addEventListener('click', () => this.generate());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        this.flipBtn.addEventListener('click', () => this.flip());

        if (this.stack) {
            this.stack.addEventListener('click', () => this.flip());
        }

        document.addEventListener('keydown', (e) => {
            const section = document.getElementById('flashcardsSection');
            if (!section || !section.classList.contains('active')) return;

            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.flip();
            } else if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
    }

    async generate() {
        const notes = this.notesInput.value.trim();
        if (!notes) {
            this.showError('Please paste some notes first!');
            return;
        }

        if (!aiService.isConnected()) {
            this.showError('API key is not configured.');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<span class="loading"></span> Generating...';

        const systemPrompt = `You are a flashcard generator for students. Convert the given notes into flashcards.
Return ONLY a JSON array of objects with "front" (question/concept) and "back" (answer/explanation).
Create 8-12 flashcards covering the key concepts.
Do not include any text outside the JSON array.
Format: [{"front": "question", "back": "answer"}, ...]`;

        try {
            const result = await aiService.generate(systemPrompt, `Create flashcards from these notes:\n\n${notes}`);
            const parsed = this.extractJsonArray(result);

            if (parsed && Array.isArray(parsed)) {
                this.flashcards = parsed.filter(c => c.front && c.back);
                if (this.flashcards.length === 0) {
                    throw new Error('No valid flashcards found in response');
                }
                this.currentIndex = 0;
                this.isFlipped = false;
                this.render();
            } else {
                throw new Error('Could not parse flashcards from AI response');
            }
        } catch (error) {
            this.showError('Error: ' + error.message);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = 'Generate Flashcards';
        }
    }

    extractJsonArray(text) {
        try {
            return JSON.parse(text);
        } catch (e) {}

        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end > start) {
            try {
                return JSON.parse(text.slice(start, end + 1));
            } catch (e) {}
        }

        return null;
    }

    render() {
        if (this.flashcards.length === 0) {
            this.stack.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎴</span>
                    <p>No flashcards yet. Paste notes and click "Generate Flashcards"</p>
                </div>`;
            if (this.nav) this.nav.style.display = 'none';
            if (this.progress) this.progress.style.display = 'none';
            if (this.hintText) this.hintText.style.display = 'none';
            return;
        }

        const card = this.flashcards[this.currentIndex];
        const front = this.escapeHtml(card.front);
        const back = this.escapeHtml(card.back);

        this.stack.innerHTML = `
            <div class="flashcard ${this.isFlipped ? 'flipped' : ''}">
                <div class="flashcard-front">
                    <div class="flashcard-label">Question</div>
                    <div class="flashcard-text">${front}</div>
                    <div class="flashcard-hint">Click to flip</div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-label">Answer</div>
                    <div class="flashcard-text">${back}</div>
                    <div class="flashcard-hint">Click to flip back</div>
                </div>
            </div>`;

        if (this.nav) this.nav.style.display = 'flex';
        if (this.counter) this.counter.textContent = `${this.currentIndex + 1} / ${this.flashcards.length}`;
        if (this.progress) this.progress.style.display = 'block';
        if (this.progressFill) {
            const pct = ((this.currentIndex + 1) / this.flashcards.length) * 100;
            this.progressFill.style.width = pct + '%';
        }
        if (this.hintText) this.hintText.style.display = 'block';
    }

    flip() {
        this.isFlipped = !this.isFlipped;
        const card = this.stack.querySelector('.flashcard');
        if (card) {
            card.classList.toggle('flipped');
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.isFlipped = false;
            this.render();
        }
    }

    next() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.isFlipped = false;
            this.render();
        }
    }

    clear() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        if (this.notesInput) this.notesInput.value = '';
        this.render();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const existing = document.querySelector('#flashcardsSection .inline-error');
        if (existing) existing.remove();

        const section = document.getElementById('flashcardsSection');
        if (!section) return;

        const el = document.createElement('div');
        el.className = 'inline-error';
        el.textContent = message;
        section.querySelector('.flashcard-controls').appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }
}

const flashcardManager = new FlashcardManager();
