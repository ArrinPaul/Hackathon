class QuizManager {
    constructor() {
        this.questions = [];
        this.answers = {};
        this.submitted = false;
        this.init();
    }

    init() {
        this.container = document.getElementById('quizContainer');
        this.generateBtn = document.getElementById('generateQuizBtn');
        this.notesInput = document.getElementById('quizNotesInput');
        this.questionCount = document.getElementById('quizQuestionCount');

        if (!this.generateBtn) return;
        this.generateBtn.addEventListener('click', () => this.generate());
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

        const count = this.questionCount.value;
        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<span class="loading"></span> Generating...';

        const systemPrompt = `You are a quiz generator for students. Create multiple choice questions from the given notes.
Return ONLY a JSON array of objects with:
- "question": the question text
- "options": array of exactly 4 answer options
- "correctIndex": index of correct answer (0, 1, 2, or 3)

Create exactly ${count} questions.
Do not include any text outside the JSON array.
Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}, ...]`;

        try {
            const result = await aiService.generate(systemPrompt, `Create a quiz from these notes:\n\n${notes}`);
            const parsed = this.extractJsonArray(result);

            if (parsed && Array.isArray(parsed)) {
                this.questions = parsed.filter(q =>
                    q.question && Array.isArray(q.options) && q.options.length >= 2
                ).map(q => ({
                    ...q,
                    correctIndex: Math.min(Math.max(0, parseInt(q.correctIndex) || 0), q.options.length - 1)
                }));

                if (this.questions.length === 0) {
                    throw new Error('No valid questions found in response');
                }

                this.answers = {};
                this.submitted = false;
                this.render();
            } else {
                throw new Error('Could not parse quiz from AI response');
            }
        } catch (error) {
            this.showError('Error: ' + error.message);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = 'Generate Quiz';
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
        if (this.questions.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>No quiz generated yet. Add notes and click "Generate Quiz"</p>
                </div>`;
            return;
        }

        const el = document.createElement('div');

        this.questions.forEach((q, qi) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'quiz-question';

            const answered = this.answers[qi] !== undefined;
            const questionText = this.escapeHtml(q.question);

            let optionsHtml = '';
            q.options.forEach((opt, oi) => {
                let classes = 'quiz-option';
                if (this.submitted) {
                    if (oi === q.correctIndex) classes += ' correct';
                    else if (this.answers[qi] === oi) classes += ' incorrect';
                } else if (this.answers[qi] === oi) {
                    classes += ' selected';
                }
                if (!this.submitted && !answered) {
                    // don't add unanswered class here, add it after if needed
                }

                optionsHtml += `
                    <div class="${classes}" data-question="${qi}" data-option="${oi}">
                        <div class="option-radio"></div>
                        <span>${this.escapeHtml(opt)}</span>
                    </div>`;
            });

            questionDiv.innerHTML = `
                <div class="question-number">Question ${qi + 1}</div>
                <div class="question-text">${questionText}</div>
                <div class="quiz-options-list">${optionsHtml}</div>`;

            el.appendChild(questionDiv);
        });

        if (this.submitted) {
            const score = this.calculateScore();
            const percentage = Math.round((score / this.questions.length) * 100);
            const resultsDiv = document.createElement('div');
            resultsDiv.className = 'quiz-results';
            resultsDiv.innerHTML = `
                <div class="quiz-score">${score} / ${this.questions.length}</div>
                <div class="quiz-score-text">You scored ${percentage}%</div>
                <button class="btn-primary" id="quizResetBtn">Try Again</button>`;
            el.appendChild(resultsDiv);
        } else {
            const unanswered = this.questions.length - Object.keys(this.answers).length;
            let btnHtml = `<button class="btn-primary mt-lg" id="quizSubmitBtn">Submit Answers</button>`;
            if (unanswered > 0) {
                btnHtml += `<p class="mt-sm" style="font-size:13px;color:hsl(var(--muted-foreground))">${unanswered} question${unanswered > 1 ? 's' : ''} unanswered</p>`;
            }
            const btnDiv = document.createElement('div');
            btnDiv.innerHTML = btnHtml;
            el.appendChild(btnDiv);
        }

        this.container.innerHTML = '';
        this.container.appendChild(el);

        if (!this.submitted) {
            this.container.querySelectorAll('.quiz-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const qi = parseInt(opt.dataset.question);
                    const oi = parseInt(opt.dataset.option);
                    this.selectAnswer(qi, oi);
                });
            });

            const submitBtn = document.getElementById('quizSubmitBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submit());
            }
        } else {
            const resetBtn = document.getElementById('quizResetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.reset());
            }
        }
    }

    selectAnswer(questionIndex, optionIndex) {
        this.answers[questionIndex] = optionIndex;
        this.render();
    }

    submit() {
        this.submitted = true;
        this.render();
    }

    calculateScore() {
        let score = 0;
        this.questions.forEach((q, qi) => {
            if (this.answers[qi] === q.correctIndex) score++;
        });
        return score;
    }

    reset() {
        this.answers = {};
        this.submitted = false;
        this.render();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const existing = document.querySelector('#quizSection .inline-error');
        if (existing) existing.remove();

        const section = document.getElementById('quizSection');
        if (!section) return;

        const el = document.createElement('div');
        el.className = 'inline-error';
        el.textContent = message;
        section.querySelector('.quiz-controls').appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }
}

const quizManager = new QuizManager();
