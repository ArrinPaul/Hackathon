/**
 * Quiz Module - Generate MCQ quizzes from notes using AI
 */

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

        this.generateBtn.addEventListener('click', () => this.generate());
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

        const count = this.questionCount.value;
        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<span class="loading"></span> Generating...';

        const systemPrompt = `You are a quiz generator for students. Create multiple choice questions from the given notes.
Return ONLY a JSON array of objects with:
- "question": the question text
- "options": array of 4 answer options
- "correctIndex": index of correct answer (0-3)

Create exactly ${count} questions.
Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}, ...]`;

        try {
            const result = await aiService.generate(systemPrompt, `Create a quiz from these notes:\n\n${notes}`);
            const jsonMatch = result.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                this.questions = JSON.parse(jsonMatch[0]);
                this.answers = {};
                this.submitted = false;
                this.render();
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            alert('Error generating quiz: ' + error.message);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = 'Generate Quiz';
        }
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

        let html = '';
        this.questions.forEach((q, qi) => {
            html += `
                <div class="quiz-question">
                    <div class="question-number">Question ${qi + 1}</div>
                    <div class="question-text">${q.question}</div>
                    <div class="quiz-options-list">
                        ${q.options.map((opt, oi) => {
                            let classes = 'quiz-option';
                            if (this.submitted) {
                                if (oi === q.correctIndex) classes += ' correct';
                                else if (this.answers[qi] === oi) classes += ' incorrect';
                            } else if (this.answers[qi] === oi) {
                                classes += ' selected';
                            }
                            return `
                                <div class="${classes}" data-question="${qi}" data-option="${oi}">
                                    <div class="option-radio"></div>
                                    <span>${opt}</span>
                                </div>`;
                        }).join('')}
                    </div>
                </div>`;
        });

        if (this.submitted) {
            const score = this.calculateScore();
            const percentage = Math.round((score / this.questions.length) * 100);
            html += `
                <div class="quiz-results">
                    <div class="quiz-score">${score} / ${this.questions.length}</div>
                    <div class="quiz-score-text">You scored ${percentage}%</div>
                    <button class="btn-primary" onclick="quizManager.reset()">Try Again</button>
                </div>`;
        } else {
            html += `<button class="btn-primary mt-lg" onclick="quizManager.submit()">Submit Answers</button>`;
        }

        this.container.innerHTML = html;

        if (!this.submitted) {
            this.container.querySelectorAll('.quiz-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const qi = parseInt(opt.dataset.question);
                    const oi = parseInt(opt.dataset.option);
                    this.selectAnswer(qi, oi);
                });
            });
        }
    }

    selectAnswer(questionIndex, optionIndex) {
        this.answers[questionIndex] = optionIndex;
        this.render();
    }

    submit() {
        if (Object.keys(this.answers).length < this.questions.length) {
            if (!confirm('You have unanswered questions. Submit anyway?')) return;
        }
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
}

const quizManager = new QuizManager();
