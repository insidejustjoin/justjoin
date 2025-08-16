import { 
  InterviewSession, 
  Answer, 
  Question, 
  AIInterviewerResponse, 
  Language,
  InterviewSummary 
} from '../../src/types/interview';
import { QuestionService } from './questionService';

export class AIInterviewerService {
  private questionService: QuestionService;

  constructor() {
    this.questionService = new QuestionService();
  }

  /**
   * 面接開始時の挨拶メッセージを生成
   */
  generateWelcomeMessage(language: Language, applicantName?: string): string {
    const messages = {
      ja: `本日はお時間をいただき、ありがとうございます${applicantName ? `、${applicantName}さん` : ''}。私はJust JoinのAI面接官です。\n\nこれから約10〜15分間の面接を行わせていただきます。リラックスして、ご自分らしくお答えください。\n\n録画と記録についてご同意いただけましたら、早速始めさせていただきます。準備はよろしいでしょうか？`,
      en: `Thank you for your time today${applicantName ? `, ${applicantName}` : ''}. I am an AI interviewer from Just Join.\n\nWe will conduct an interview for about 10-15 minutes. Please relax and answer in your own way.\n\nOnce you agree to recording and documentation, we can begin immediately. Are you ready?`
    };

    return messages[language] || messages.ja;
  }

  /**
   * 質問に対する自然な導入メッセージを生成
   */
  generateQuestionIntroduction(question: Question, language: Language, isFirst: boolean = false): string {
    if (isFirst) {
      const intros = {
        ja: 'それでは、最初の質問をさせていただきます。',
        en: 'Now, let me ask you the first question.'
      };
      return intros[language] || intros.ja;
    }

    const randomIntros = {
      ja: [
        'ありがとうございます。次の質問に移らせていただきます。',
        'なるほど、よく分かりました。では、続いてお聞きします。',
        'お答えいただき、ありがとうございます。次にお伺いしたいのは...',
        '興味深いお話ですね。それでは次の質問です。'
      ],
      en: [
        'Thank you. Let me move on to the next question.',
        'I see, that\'s very clear. Now, let me ask you about...',
        'Thank you for your answer. Next, I\'d like to ask...',
        'That\'s very interesting. Now, here\'s the next question.'
      ]
    };

    const intros = randomIntros[language] || randomIntros.ja;
    const randomIndex = Math.floor(Math.random() * intros.length);
    return intros[randomIndex];
  }

  /**
   * 回答に対するリアクションを生成
   */
  generateResponseReaction(answer: Answer, language: Language): string {
    const wordCount = answer.wordCount;
    const responseTime = answer.responseTime;

    // 回答の長さと回答時間に基づいてリアクションを調整
    let reactionType: 'positive' | 'encouraging' | 'neutral' = 'neutral';

    if (wordCount > 50 && responseTime < 300) {
      reactionType = 'positive';
    } else if (wordCount < 20 || responseTime > 600) {
      reactionType = 'encouraging';
    }

    const reactions = {
      ja: {
        positive: [
          'とても詳しく説明していただき、ありがとうございます。',
          '具体的で分かりやすいお答えですね。',
          '素晴らしい経験をお持ちですね。'
        ],
        encouraging: [
          'ありがとうございます。',
          'なるほど、理解いたします。',
          'お答えいただき、ありがとうございます。'
        ],
        neutral: [
          'ありがとうございます。',
          'よく分かりました。',
          'なるほど、そうですね。'
        ]
      },
      en: {
        positive: [
          'Thank you for the detailed explanation.',
          'That\'s a very clear and specific answer.',
          'You have wonderful experience.'
        ],
        encouraging: [
          'Thank you.',
          'I understand.',
          'Thank you for your answer.'
        ],
        neutral: [
          'Thank you.',
          'I see.',
          'That makes sense.'
        ]
      }
    };

    const reactionList = reactions[language]?.[reactionType] || reactions.ja[reactionType];
    const randomIndex = Math.floor(Math.random() * reactionList.length);
    return reactionList[randomIndex];
  }

  /**
   * 面接完了時のメッセージを生成
   */
  generateCompletionMessage(session: InterviewSession, language: Language): string {
    const totalTime = Math.floor((session.totalDuration || 0) / 60);
    const answeredQuestions = session.answers?.length || 0;

    const messages = {
      ja: `お疲れさまでした。面接が完了いたしました。\n\n所要時間: 約${totalTime}分\n回答いただいた質問数: ${answeredQuestions}問\n\n本日は貴重なお時間をいただき、ありがとうございました。面接結果については、後日担当者よりご連絡いたします。\n\n何かご質問がございましたら、いつでもお気軽にお問い合わせください。`,
      en: `Thank you for your time. The interview has been completed.\n\nDuration: Approximately ${totalTime} minutes\nQuestions answered: ${answeredQuestions}\n\nThank you for your valuable time today. We will contact you about the interview results later.\n\nIf you have any questions, please feel free to contact us at any time.`
    };

    return messages[language] || messages.ja;
  }

  /**
   * 次の質問を取得し、AIレスポンスを生成
   */
  async getNextQuestionResponse(
    session: InterviewSession, 
    lastAnswer?: Answer
  ): Promise<AIInterviewerResponse> {
    const language = session.language;
    let message = '';
    let nextQuestion: Question | undefined;

    console.log('getNextQuestionResponse呼び出し:', {
      sessionId: session.id,
      currentQuestionIndex: session.currentQuestionIndex,
      lastAnswer: lastAnswer?.questionId
    });

    // 回答がある場合はリアクションを生成
    if (lastAnswer) {
      message += this.generateResponseReaction(lastAnswer, language) + '\n\n';
    }

    // 次の質問を取得（現在の質問の次の質問）
    if (lastAnswer) {
      // 回答がある場合は、その質問の次の質問を取得
      nextQuestion = this.questionService.getNextQuestion(lastAnswer.questionId);
      console.log('次の質問（回答あり）:', nextQuestion);
    } else {
      // 回答がない場合は、現在のインデックスの質問を取得
      nextQuestion = this.questionService.getQuestionByIndex(session.currentQuestionIndex);
      console.log('次の質問（回答なし）:', nextQuestion);
    }

    if (nextQuestion) {
      // 質問導入メッセージを追加
      const isFirst = session.currentQuestionIndex === 0;
      message += this.generateQuestionIntroduction(nextQuestion, language, isFirst) + '\n\n';
      
      // 質問テキストを追加
      message += nextQuestion.text[language];
    }

    const isComplete = !nextQuestion;
    console.log('面接完了チェック:', { isComplete, nextQuestionId: nextQuestion?.id });

    return {
      message: message.trim(),
      nextQuestion,
      isComplete,
      sessionId: session.id,
      timestamp: new Date()
    };
  }

  /**
   * 面接開始のレスポンスを生成
   */
  async startInterview(session: InterviewSession): Promise<AIInterviewerResponse> {
    const welcomeMessage = this.generateWelcomeMessage(session.language);
    const firstQuestion = this.questionService.getFirstQuestion();

    let message = welcomeMessage;
    
    if (firstQuestion) {
      message += '\n\n' + this.generateQuestionIntroduction(firstQuestion, session.language, true);
      message += '\n\n' + firstQuestion.text[session.language];
    }

    return {
      message,
      nextQuestion: firstQuestion,
      isComplete: false,
      sessionId: session.id,
      timestamp: new Date()
    };
  }

  /**
   * 面接終了のレスポンスを生成
   */
  async endInterview(session: InterviewSession): Promise<AIInterviewerResponse> {
    const completionMessage = this.generateCompletionMessage(session, session.language);

    return {
      message: completionMessage,
      nextQuestion: undefined,
      isComplete: true,
      sessionId: session.id,
      timestamp: new Date()
    };
  }

  /**
   * 回答の簡易評価を行う
   */
  evaluateAnswer(answer: Answer, question: Question): {
    wordCount: number;
    sentimentScore: number;
    completeness: number;
  } {
    const text = answer.text.trim();
    const wordCount = text.split(/\s+/).length;
    
    // 簡易的な感情分析（実際の実装ではより高度なNLP使用）
    const positiveWords = ['成功', '達成', '学習', '成長', '協力', 'チーム', '貢献', 'success', 'achieve', 'learn', 'growth', 'cooperation', 'team', 'contribute'];
    const negativeWords = ['失敗', '困難', '問題', 'failure', 'difficult', 'problem'];
    
    let sentiment = 0;
    positiveWords.forEach(word => {
      if (text.includes(word)) sentiment += 1;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) sentiment -= 0.5;
    });
    
    const sentimentScore = Math.max(-1, Math.min(1, sentiment / 10));

    // 完全性の評価（推奨文字数との比較）
    const recommendedLength = question.maxLength ? question.maxLength * 0.3 : 100;
    const completeness = Math.min(1, text.length / recommendedLength);

    return {
      wordCount,
      sentimentScore,
      completeness
    };
  }

  /**
   * 面接サマリーを生成
   */
  generateInterviewSummary(session: InterviewSession): InterviewSummary {
    const answers = session.answers || [];
    const totalQuestions = this.questionService.getTotalQuestionCount();
    const answeredQuestions = answers.length;
    const totalDuration = session.totalDuration || 0;
    const averageResponseTime = answers.length > 0 
      ? answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length 
      : 0;

    // 簡易的な評価ロジック
    const completionRate = answeredQuestions / totalQuestions;
    const avgSentiment = answers.length > 0
      ? answers.reduce((sum, a) => sum + (a.sentimentScore || 0), 0) / answers.length
      : 0;

    let recommendation: InterviewSummary['recommendation'] = 'maybe';
    if (completionRate >= 0.9 && avgSentiment > 0.3) {
      recommendation = 'yes';
    } else if (completionRate >= 0.7 && avgSentiment > 0.1) {
      recommendation = 'maybe';
    } else {
      recommendation = 'no';
    }

    const keyInsights = this.extractKeyInsights(answers, session.language);
    const strengths = this.extractStrengths(answers, session.language);
    const areasForImprovement = this.extractAreasForImprovement(answers, session.language);

    return {
      sessionId: session.id,
      applicantId: session.applicantId,
      totalQuestions,
      answeredQuestions,
      totalDuration,
      averageResponseTime,
      completionRate,
      keyInsights,
      overallScore: Math.round((completionRate * 0.6 + (avgSentiment + 1) * 0.4) * 100),
      strengths,
      areas_for_improvement: areasForImprovement,
      recommendation,
      notes: `面接完了率: ${Math.round(completionRate * 100)}%, 平均回答時間: ${Math.round(averageResponseTime)}秒`,
      createdAt: new Date()
    };
  }

  private extractKeyInsights(answers: Answer[], language: Language): string[] {
    // 簡易的なキーワード抽出
    const insights: string[] = [];
    
    answers.forEach(answer => {
      if (answer.text.length > 100) {
        if (language === 'ja') {
          if (answer.text.includes('チーム')) insights.push('チームワークを重視');
          if (answer.text.includes('学習') || answer.text.includes('勉強')) insights.push('学習意欲が高い');
          if (answer.text.includes('成長')) insights.push('成長志向');
        } else {
          if (answer.text.includes('team')) insights.push('Values teamwork');
          if (answer.text.includes('learn')) insights.push('High learning motivation');
          if (answer.text.includes('growth')) insights.push('Growth-oriented');
        }
      }
    });

    return [...new Set(insights)].slice(0, 3);
  }

  private extractStrengths(answers: Answer[], language: Language): string[] {
    const strengths: string[] = [];
    
    answers.forEach(answer => {
      if (answer.responseTime < 120 && answer.text.length > 80) {
        if (language === 'ja') {
          strengths.push('迅速で詳細な回答能力');
        } else {
          strengths.push('Quick and detailed response ability');
        }
      }
    });

    return [...new Set(strengths)].slice(0, 3);
  }

  private extractAreasForImprovement(answers: Answer[], language: Language): string[] {
    const improvements: string[] = [];
    
    const shortAnswers = answers.filter(a => a.text.length < 50).length;
    if (shortAnswers > answers.length * 0.3) {
      if (language === 'ja') {
        improvements.push('より詳細な回答の提供');
      } else {
        improvements.push('Providing more detailed answers');
      }
    }

    return improvements.slice(0, 3);
  }
} 