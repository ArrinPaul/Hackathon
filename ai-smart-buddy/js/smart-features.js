class SmartFeatures {
    constructor() {
        this.modal = document.getElementById('toolModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalInput = document.getElementById('modalInput');
        this.modalOptions = document.getElementById('modalOptions');
        this.modalActionBtn = document.getElementById('modalActionBtn');
        this.modalResult = document.getElementById('modalResult');
        this.closeModalBtn = document.getElementById('closeModalBtn');

        this.currentTool = null;

        this.toolAliases = {
            'summarize-notes': 'summarize',
            'study-schedule': 'schedule',
            'concept-map': 'diagram',
            'explain-concept': 'explain',
            'attendance-risk': 'attendance',
            'notice-summarizer': 'notice'
        };

        if (!this.closeModalBtn) return;

        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        this.modalActionBtn.addEventListener('click', () => this.executeTool());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });

        this.tools = {
            summarize: {
                slug: 'summarize-notes',
                title: 'Summarize Notes',
                placeholder: 'Paste your lecture notes to get a concise summary...',
                action: 'Summarize'
            },
            schedule: {
                slug: 'study-schedule',
                title: 'Study Schedule',
                placeholder: 'Describe your exam schedule and available study hours...',
                action: 'Generate Schedule',
                options: [
                    { label: 'Exam Date', type: 'date', id: 'examDate' },
                    { label: 'Daily Study Hours', type: 'number', id: 'studyHours', value: 4 }
                ]
            },
            diagram: {
                slug: 'concept-map',
                title: 'Concept Map',
                placeholder: 'Paste content to convert into a concept diagram...',
                action: 'Generate Diagram'
            },
            explain: {
                slug: 'explain-concept',
                title: 'Explain Concept',
                placeholder: 'Enter the concept you want explained simply...',
                action: 'Explain'
            },
            attendance: {
                slug: 'attendance-risk',
                title: 'Attendance Risk Check',
                placeholder: 'Enter subjects and attendance % (e.g., "Math: 75, Physics: 60, CS: 90")...',
                action: 'Check Risk'
            },
            notice: {
                slug: 'notice-summarizer',
                title: 'Notice Summarizer',
                placeholder: 'Paste the college notice here...',
                action: 'Summarize Notice'
            }
        };
    }

    resolveToolName(toolName) {
        return this.tools[toolName] ? toolName : this.toolAliases[toolName] || toolName;
    }

    open(toolName, fromRoute = false) {
        this.currentTool = this.resolveToolName(toolName);
        const tool = this.tools[this.currentTool];

        if (!tool) return;

        this.modalTitle.textContent = tool.title;
        this.modalInput.value = '';
        this.modalInput.placeholder = tool.placeholder;
        this.modalResult.innerHTML = '';
        this.modalActionBtn.textContent = tool.action;
        this.modalActionBtn.disabled = false;

        this.modalOptions.innerHTML = '';
        if (tool.options) {
            tool.options.forEach(opt => {
                const group = document.createElement('div');
                group.className = 'form-group';
                group.innerHTML = `
                    <label for="${opt.id}">${opt.label}</label>
                    <input type="${opt.type}" id="${opt.id}" value="${opt.value || ''}">`;
                this.modalOptions.appendChild(group);
            });
        }

        this.modal.classList.add('active');

        if (!fromRoute && typeof app !== 'undefined') {
            history.pushState({}, '', '/tools/' + tool.slug);
        }
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.currentTool = null;
        if (typeof app !== 'undefined') {
            history.pushState({}, '', '/tools');
        }
    }

    async executeTool() {
        const content = this.modalInput.value.trim();
        const tool = this.tools[this.currentTool];

        if (!tool) return;

        if (!content && this.currentTool !== 'schedule') {
            this.showResultError('Please enter some content first!');
            return;
        }

        if (!aiService.isConnected()) {
            this.showResultError('API key is not configured.');
            return;
        }

        this.modalActionBtn.disabled = true;
        this.modalActionBtn.innerHTML = '<span class="loading"></span> Processing...';
        this.modalResult.innerHTML = '';

        let systemPrompt = '';
        let userPrompt = '';

        switch (this.currentTool) {
            case 'summarize':
                systemPrompt = 'You are a note summarizer. Create a concise summary with key points in bullet format. Keep it under 200 words.';
                userPrompt = `Summarize these notes:\n\n${content}`;
                break;

            case 'schedule': {
                const examDate = document.getElementById('examDate')?.value || 'next week';
                const studyHours = document.getElementById('studyHours')?.value || 4;
                systemPrompt = `You are a study schedule planner. Create a detailed daily study plan.
Available study hours per day: ${studyHours}.
Exam date: ${examDate}.
Include subjects, topics, break times, and revision slots.
Format as a clear daily schedule.`;
                userPrompt = content
                    ? `Create a study schedule for these subjects/topics:\n\n${content}`
                    : 'Create a study schedule using the provided exam date and daily study hours.';
                break;
            }

            case 'diagram':
                systemPrompt = `You are a concept mapper. Convert the given content into a structured concept map.
Use this format:
LEVEL 1: Main Topic
  LEVEL 2: Sub-topic
    - Key point 1
    - Key point 2
Show relationships between concepts clearly.`;
                userPrompt = `Create a concept map for:\n\n${content}`;
                break;

            case 'explain':
                systemPrompt = `You are a friendly teacher. Explain the concept in simple terms:
1. Start with a simple analogy
2. Give a clear definition
3. Provide 2-3 real-world examples
4. Mention common misconceptions
Keep it conversational and easy to understand.`;
                userPrompt = `Explain this concept simply:\n\n${content}`;
                break;

            case 'attendance':
                systemPrompt = `You are an attendance risk analyzer. Analyze the attendance percentages and:
1. Flag subjects at risk (below 75%)
2. Calculate how many more classes can be missed
3. Provide action plan for each at-risk subject
4. Give overall risk assessment
Use clear formatting with emojis for status indicators.`;
                userPrompt = `Analyze these attendance records:\n\n${content}`;
                break;

            case 'notice':
                systemPrompt = `You are a notice summarizer. Extract key information from college notices:
1. What is the notice about?
2. Key dates and deadlines
3. Who needs to take action
4. Any important instructions
Format as clear bullet points.`;
                userPrompt = `Summarize this notice:\n\n${content}`;
                break;
        }

        try {
            const result = await aiService.generate(systemPrompt, userPrompt);
            this.modalResult.innerHTML = this.formatResult(result);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'result-copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(result).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
                });
            });
            this.modalResult.appendChild(copyBtn);
        } catch (error) {
            this.showResultError('Error: ' + error.message);
        } finally {
            this.modalActionBtn.disabled = false;
            this.modalActionBtn.textContent = tool.action;
        }
    }

    showResultError(message) {
        this.modalResult.innerHTML = '';
        const el = document.createElement('div');
        el.className = 'inline-error';
        el.textContent = message;
        this.modalResult.appendChild(el);
    }

    formatResult(text) {
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
            if (line.match(/^- /) || line.match(/^\d+\. /)) {
                if (!inList) {
                    const isOrdered = line.match(/^\d+\. /);
                    result += isOrdered ? '<ol>' : '<ul>';
                    inList = isOrdered ? 'ol' : 'ul';
                }
                result += `<li>${line.replace(/^[-\d.]+ /, '')}</li>`;
            } else {
                if (inList) {
                    result += `</${inList}>`;
                    inList = false;
                }
                if (line.trim()) {
                    result += `<p>${line}</p>`;
                }
            }
        }

        if (inList) result += `</${inList}>`;
        return result;
    }
}

const smartFeatures = new SmartFeatures();

function openToolModal(toolName, fromRoute = false) {
    smartFeatures.open(toolName, fromRoute);
}
