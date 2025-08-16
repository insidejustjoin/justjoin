"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionService = void 0;
// 面接質問データベース
const INTERVIEW_QUESTIONS = [
    {
        id: 'q1',
        type: 'introduction',
        text: {
            ja: 'まず初めに、簡単に自己紹介をしてください。お名前、現在のご職業、簡単な経歴について教えてください。',
            en: 'First, please introduce yourself briefly. Tell me your name, current position, and a brief overview of your background.'
        },
        order: 1,
        isRequired: true,
        maxLength: 300,
        estimatedTime: 120
    },
    {
        id: 'q2',
        type: 'experience',
        text: {
            ja: '現在のお仕事の内容について詳しく教えてください。どのような業務を担当されていますか？',
            en: 'Please tell me about your current job responsibilities in detail. What kind of work do you handle?'
        },
        order: 2,
        isRequired: true,
        maxLength: 400,
        estimatedTime: 150
    },
    {
        id: 'q3',
        type: 'achievement',
        text: {
            ja: 'これまでに最も達成感を感じたプロジェクトや業務について教えてください。その成果と学んだことについても聞かせてください。',
            en: 'Please tell me about the project or work that gave you the most sense of achievement. What were the results and what did you learn?'
        },
        order: 3,
        isRequired: true,
        maxLength: 500,
        estimatedTime: 180
    },
    {
        id: 'q4',
        type: 'teamwork',
        text: {
            ja: 'チームでの働き方についてお聞きします。あなたはチームの中でどのような役割を果たすことが多いですか？',
            en: 'Let me ask about your teamwork style. What role do you usually play within a team?'
        },
        order: 4,
        isRequired: true,
        maxLength: 350,
        estimatedTime: 140
    },
    {
        id: 'q5',
        type: 'motivation',
        text: {
            ja: '当社（Just Join）に応募された理由を教えてください。なぜ私たちの会社で働きたいと思われたのですか？',
            en: 'Please tell me why you applied to our company (Just Join). What made you want to work with us?'
        },
        order: 5,
        isRequired: true,
        maxLength: 400,
        estimatedTime: 160
    },
    {
        id: 'q6',
        type: 'strength_weakness',
        text: {
            ja: 'ご自身の強みと弱みについて教えてください。それぞれ具体例も含めて説明していただけますか？',
            en: 'Please tell me about your strengths and weaknesses. Could you provide specific examples for each?'
        },
        order: 6,
        isRequired: true,
        maxLength: 450,
        estimatedTime: 170
    },
    {
        id: 'q7',
        type: 'technical',
        text: {
            ja: '技術的なスキルについてお聞きします。現在得意としている分野と、今後学びたい技術や分野があれば教えてください。',
            en: 'Let me ask about your technical skills. What areas are you currently good at, and are there any technologies or fields you want to learn in the future?'
        },
        order: 7,
        isRequired: true,
        maxLength: 400,
        estimatedTime: 160
    },
    {
        id: 'q8',
        type: 'problem_solving',
        text: {
            ja: '困難な問題や課題に直面した時、あなたはどのようにアプローチしますか？具体的な経験があれば教えてください。',
            en: 'How do you approach difficult problems or challenges? Please share a specific experience if you have one.'
        },
        order: 8,
        isRequired: true,
        maxLength: 450,
        estimatedTime: 170
    },
    {
        id: 'q9',
        type: 'career_vision',
        text: {
            ja: '将来的なキャリアビジョンについて教えてください。3〜5年後、どのような成長を目指していますか？',
            en: 'Please tell me about your future career vision. What kind of growth are you aiming for in 3-5 years?'
        },
        order: 9,
        isRequired: true,
        maxLength: 400,
        estimatedTime: 160
    },
    {
        id: 'q10',
        type: 'questions',
        text: {
            ja: '最後に、当社や職種について何かご質問はありますか？気になることがあれば何でもお聞きください。',
            en: 'Finally, do you have any questions about our company or the position? Please feel free to ask anything you are curious about.'
        },
        order: 10,
        isRequired: false,
        maxLength: 300,
        estimatedTime: 120
    }
];
class QuestionService {
    constructor() {
        this.questions = [...INTERVIEW_QUESTIONS];
    }
    /**
     * すべての質問を取得
     */
    getAllQuestions() {
        return this.questions.sort((a, b) => a.order - b.order);
    }
    /**
     * 特定の質問を取得
     */
    getQuestionById(id) {
        return this.questions.find(q => q.id === id);
    }
    /**
     * 順序による質問取得
     */
    getQuestionByIndex(index) {
        const sortedQuestions = this.getAllQuestions();
        return sortedQuestions[index];
    }
    /**
     * 次の質問を取得
     */
    getNextQuestion(currentQuestionId) {
        const current = this.getQuestionById(currentQuestionId);
        if (!current)
            return undefined;
        const sortedQuestions = this.getAllQuestions();
        const currentIndex = sortedQuestions.findIndex(q => q.id === currentQuestionId);
        if (currentIndex === -1 || currentIndex >= sortedQuestions.length - 1) {
            return undefined;
        }
        return sortedQuestions[currentIndex + 1];
    }
    /**
     * 質問の総数を取得
     */
    getTotalQuestionCount() {
        return this.questions.length;
    }
    /**
     * 必須質問のみを取得
     */
    getRequiredQuestions() {
        return this.questions.filter(q => q.isRequired).sort((a, b) => a.order - b.order);
    }
    /**
     * 質問タイプによる取得
     */
    getQuestionsByType(type) {
        return this.questions.filter(q => q.type === type).sort((a, b) => a.order - b.order);
    }
    /**
     * 推定面接時間を計算
     */
    getEstimatedTotalTime() {
        return this.questions.reduce((total, question) => total + question.estimatedTime, 0);
    }
    /**
     * 質問の進捗率を計算
     */
    getProgressPercentage(currentQuestionIndex) {
        const totalQuestions = this.getTotalQuestionCount();
        if (totalQuestions === 0)
            return 0;
        return Math.round((currentQuestionIndex / totalQuestions) * 100);
    }
    /**
     * 言語に応じた質問テキストを取得
     */
    getQuestionText(questionId, language) {
        const question = this.getQuestionById(questionId);
        if (!question)
            return '';
        return question.text[language] || question.text.ja;
    }
    /**
     * 最初の質問を取得
     */
    getFirstQuestion() {
        const sortedQuestions = this.getAllQuestions();
        return sortedQuestions.length > 0 ? sortedQuestions[0] : undefined;
    }
    /**
     * 面接が完了しているかチェック
     */
    isInterviewComplete(currentQuestionIndex) {
        return currentQuestionIndex >= this.getTotalQuestionCount();
    }
}
exports.QuestionService = QuestionService;
//# sourceMappingURL=questionService.js.map