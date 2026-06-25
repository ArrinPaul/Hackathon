/**
 * Flashcard Module - Generate flashcards from notes using AI
 */

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

        this.generateBtn.addEventListener('click', () => this.generate());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        this.flipBtn.addEventListener('click', () => this.flip());

        if (this.stack) {
            this.stack.addEventListener('click', () => this.flip());
        }
    }

    async generate() {
        const notes = this.notesInput.value.trim();
        if (!notes) {
            alert('Please paste some notes first!');
            return;
        }

        if (!aiService.isConnected()) {
            alert('API key is not configured.');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<span class="loading"></span> Generating...';

        const systemPrompt = `You are a flashcard generator for students. Convert the given notes into flashcards.
Return ONLY a JSON array of objects with "front" (question/concept) and "back" (answer/explanation).
Create 8-12 flashcards covering the key concepts.
Format: [{"front": "question", "back": "answer"}, ...]`;

        try {
            const result = await aiService.generate(systemPrompt, `Create flashcards from these notes:\n\n${notes}`);
            const jsonMatch = result.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                this.flashcards = JSON.parse(jsonMatch[0]);
                this.currentIndex = 0;
                this.isFlipped = false;
                this.render();
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            alert('Error generating flashcards: ' + error.message);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = 'Generate Flashcards';
        }
    }

    render() {
        if (this.flashcards.length === 0) {
            this.stack.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎴</span>
                    <p>No flashcards yet. Paste notes and click "Generate Flashcards"</p>
                </div>`;
            this.nav.style.display = 'none';
            return;
        }

        const card = this.flashcards[this.currentIndex];
        this.stack.innerHTML = `
            <div class="flashcard ${this.isFlipped ? 'flipped' : ''}">
                <div class="flashcard-front">
                    <div class="flashcard-label">Question</div>
                    <div class="flashcard-text">${card.front}</div>
                    <div class="flashcard-hint">Click to flip</div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-label">Answer</div>
                    <div class="flashcard-text">${card.back}</div>
                    <div class="flashcard-hint">Click to flip back</div>
                </div>
            </div>`;

        this.nav.style.display = 'flex';
        this.counter.textContent = `${this.currentIndex + 1} / ${this.flashcards.length}`;
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
        this.notesInput.value = '';
        this.render();
    }
}

const flashcardManager = new FlashcardManager();
