import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      getResponse?: (widgetId?: number) => string;
      render?: (container: any, parameters: any) => any;
      reset?: (widgetId?: number) => void;
    };
  }
}

interface JobSeekerRegisterStartProps {
  onExistingUser?: () => void;
}

export const JobSeekerRegisterStart: React.FC<JobSeekerRegisterStartProps> = ({ onExistingUser }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const recaptchaRenderRef = useRef<() => void>(() => {});
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  // v2 明示レンダリング（SPAで自動レンダリングが効かない場合に対応）
  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let scriptEl: HTMLScriptElement | null = null;
    let loadListener: (() => void) | null = null;

    const renderRecaptcha = () => {
      if (cancelled || widgetIdRef.current !== null || !recaptchaContainerRef.current) return;
      const grecaptcha = typeof window !== 'undefined' ? window.grecaptcha : undefined;
      if (!grecaptcha || typeof grecaptcha.render !== 'function' || typeof grecaptcha.ready !== 'function') return;

      grecaptcha.ready(() => {
        if (cancelled || widgetIdRef.current !== null || !recaptchaContainerRef.current) return;
        try {
          const id = grecaptcha.render(recaptchaContainerRef.current as Element, { sitekey: siteKey });
          // @ts-ignore
          widgetIdRef.current = typeof id === 'number' ? id : Number(id);
          setIsRecaptchaReady(true);
        } catch (error) {
          console.warn('reCAPTCHA render error', error);
        }
      });
    };

    const ensureScript = () => {
      if (typeof document === 'undefined') return;
      const existing = document.querySelector<HTMLScriptElement>('script[src^="https://www.google.com/recaptcha/api.js"]');
      if (existing) {
        scriptEl = existing;
        if ((window as any).grecaptcha) {
          renderRecaptcha();
        } else {
          loadListener = () => renderRecaptcha();
          existing.addEventListener('load', loadListener);
        }
      } else {
        scriptEl = document.createElement('script');
        scriptEl.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=ja';
        scriptEl.async = true;
        scriptEl.defer = true;
        loadListener = () => renderRecaptcha();
        scriptEl.addEventListener('load', loadListener);
        document.head.appendChild(scriptEl);
      }
    };

    recaptchaRenderRef.current = renderRecaptcha;
    setIsRecaptchaReady(false);
    ensureScript();
    interval = setInterval(renderRecaptcha, 1000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (loadListener && scriptEl) {
        scriptEl.removeEventListener('load', loadListener);
      }
      recaptchaRenderRef.current = () => {};
    };
  }, [siteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      // reCAPTCHA v2（チェックボックス）のレスポンスを優先
      let recaptchaV2Response = '';
      if (typeof window !== 'undefined' && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        try {
          if (!isRecaptchaReady) {
            throw new Error('reCAPTCHA is not ready yet');
          }
          // 特定ウィジェットIDがある場合は指定して取得
          // @ts-ignore
          recaptchaV2Response =
            widgetIdRef.current !== null ? window.grecaptcha.getResponse(widgetIdRef.current) : window.grecaptcha.getResponse();
        } catch (error) {
          console.warn('reCAPTCHA v2レスポンス取得に失敗しました', error);
          setMessage({
            type: 'error',
            text: 'reCAPTCHAの初期化中です。数秒後に再度お試しください。'
          });
          return;
        }
      }
      // v3はフォールバックとして取得（将来のスコア評価用）
      let recaptchaToken: string | undefined;
      if (!recaptchaV2Response && siteKey && typeof window !== 'undefined' && window.grecaptcha) {
        try {
          recaptchaToken = await new Promise<string>((resolve, reject) => {
            window.grecaptcha.ready(() => {
              window.grecaptcha
                .execute(siteKey, { action: 'register_check' })
                .then(resolve)
                .catch((err) => {
                  console.error('reCAPTCHA v3実行エラー:', err);
                  reject(err);
                });
            });
          });
        } catch (error) {
          console.error('reCAPTCHA v3実行エラー:', error);
        }
      }

      const response = await fetch('/api/register/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          recaptchaToken,
          'g-recaptcha-response': recaptchaV2Response || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const availability = {
          canRegisterEngineer: data.canRegisterEngineer !== false,
          canRegisterGeneral: data.canRegisterGeneral !== false,
          existingRegistrationTypes: Array.isArray(data.existingRegistrationTypes) ? data.existingRegistrationTypes : [],
          userExists: !!data.userExists
        };

        if (!availability.canRegisterEngineer && !availability.canRegisterGeneral) {
          setMessage({
            type: 'error',
            text: 'このメールアドレスではエンジニア・一般職の両方が登録済みです。ログインページへ移動してください。'
          });
          if (onExistingUser) {
            onExistingUser();
          }
          setTimeout(() => {
            navigate('/jobseeker/login');
          }, 2500);
          return;
        }

        navigate('/jobseeker/register/type', {
          state: { email, firstName, lastName, availability }
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'エラーが発生しました' });
      }
    } catch (error) {
      console.error('登録チェックエラー:', error);
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました。再度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          新規登録 / New Registration
        </CardTitle>
        <CardDescription className="text-center">
          メールアドレスとお名前を入力してください / Please enter your email and name
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline-block h-4 w-4 mr-2" />
              メールアドレス / Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">
              <User className="inline-block h-4 w-4 mr-2" />
              名 / First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="太郎"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              <User className="inline-block h-4 w-4 mr-2" />
              姓 / Last Name
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="山田"
              required
              disabled={isLoading}
            />
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* reCAPTCHA v2 チェックボックス */}
          <div className="my-2 flex justify-center">
          {siteKey && (
            <div className="flex flex-col items-center space-y-2">
              <div ref={recaptchaContainerRef} className="g-recaptcha" data-sitekey={siteKey}></div>
              {!isRecaptchaReady && (
                <p className="text-xs text-muted-foreground">reCAPTCHAを読み込み中です…</p>
              )}
            </div>
          )}
          </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !isRecaptchaReady}
          onMouseEnter={() => recaptchaRenderRef.current()}
          onFocus={() => recaptchaRenderRef.current()}
          onClick={() => recaptchaRenderRef.current()}
        >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                確認中 / Checking...
              </>
            ) : (
              <>
                次へ / Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            既にアカウントをお持ちの方は{' '}
            <a href="/jobseeker/login" className="text-primary hover:underline">
              こちらからログイン
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

