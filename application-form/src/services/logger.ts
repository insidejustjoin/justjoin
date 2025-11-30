import { emailService } from './emailService.js';

export interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  details?: any;
  userId?: string;
  action?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500; // 最大ログ数を1000から500に削減
  private errorThreshold = 10; // エラー通知の閾値を5から10に増加
  private errorCount = 0;
  private lastErrorNotification = 0;
  private logRotationInterval = 24 * 60 * 60 * 1000; // 24時間ごとにログローテーション
  private lastLogRotation = Date.now();

  // ログレベル
  readonly levels: LogLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug'
  };

  // ログ追加
  private addLog(level: string, message: string, details?: any, userId?: string, action?: string) {
    // ログローテーションのチェック
    const now = Date.now();
    if (now - this.lastLogRotation > this.logRotationInterval) {
      this.rotateLogs();
      this.lastLogRotation = now;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      userId,
      action
    };

    this.logs.push(logEntry);

    // ログ数が上限を超えた場合、古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // コンソールに出力（本番環境では最小限に）
    if (process.env.NODE_ENV !== 'production' || level === 'error') {
      console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, details || '');
    }

    // エラーログの場合、通知を検討
    if (level === 'error') {
      this.handleError(logEntry);
    }
  }

  // ログローテーション
  private rotateLogs() {
    // 古いログを削除（最新の100件のみ保持）
    this.logs = this.logs.slice(-100);
    console.log('Logger: Logs rotated, keeping latest 100 entries');
  }

  // エラー処理
  private async handleError(logEntry: LogEntry) {
    this.errorCount++;

    // エラー数が閾値を超えた場合、管理者に通知
    if (this.errorCount >= this.errorThreshold) {
      const now = Date.now();
      const timeSinceLastNotification = now - this.lastErrorNotification;

      // 前回の通知から1時間以上経過している場合のみ通知
      if (timeSinceLastNotification > 60 * 60 * 1000) {
        await this.sendErrorNotification();
        this.lastErrorNotification = now;
        this.errorCount = 0;
      }
    }
  }

  // エラー通知送信
  private async sendErrorNotification() {
    try {
      const recentErrors = this.logs
        .filter(log => log.level === 'error')
        .slice(-10); // 最新10件

      const errorSummary = recentErrors
        .map(error => `[${error.timestamp}] ${error.message}`)
        .join('\n');

      const adminEmail = process.env.ADMIN_EMAIL || 'whoami.inc.inside@gmail.com';
      
      await emailService.sendErrorNotification(
        adminEmail,
        'システムエラー通知',
        `以下のエラーが発生しています：\n\n${errorSummary}`
      );

      this.info('エラー通知を管理者に送信しました', { errorCount: this.errorCount });
    } catch (error) {
      console.error('エラー通知の送信に失敗しました:', error);
    }
  }

  // パブリックメソッド
  info(message: string, details?: any, userId?: string, action?: string) {
    this.addLog(this.levels.INFO, message, details, userId, action);
  }

  warn(message: string, details?: any, userId?: string, action?: string) {
    this.addLog(this.levels.WARN, message, details, userId, action);
  }

  error(message: string, details?: any, userId?: string, action?: string) {
    this.addLog(this.levels.ERROR, message, details, userId, action);
  }

  debug(message: string, details?: any, userId?: string, action?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.addLog(this.levels.DEBUG, message, details, userId, action);
    }
  }

  // ログ取得
  getLogs(level?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  // ログクリア
  clearLogs() {
    this.logs = [];
  }

  // 統計情報取得
  getStats() {
    const totalLogs = this.logs.length;
    const errorLogs = this.logs.filter(log => log.level === 'error').length;
    const warnLogs = this.logs.filter(log => log.level === 'warn').length;
    const infoLogs = this.logs.filter(log => log.level === 'info').length;

    return {
      total: totalLogs,
      errors: errorLogs,
      warnings: warnLogs,
      info: infoLogs,
      errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0
    };
  }
}

export const logger = new Logger(); 