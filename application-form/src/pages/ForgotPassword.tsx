import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'job_seeker' | 'company'>('job_seeker');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await resetPassword(email, userType, language);
      
      if (success) {
        toast({
          title: t('auth.passwordResetSuccess'),
          description: t('auth.passwordResetEmailSent'),
        });
        navigate('/jobseeker');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t('auth.error'),
        description: t('auth.passwordResetFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('auth.forgotPassword')}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {t('auth.forgotPasswordDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType">{t('auth.userType')}</Label>
              <Select value={userType} onValueChange={(value: 'job_seeker' | 'company') => setUserType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('auth.selectUserType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_seeker">{t('auth.jobSeeker')}</SelectItem>
                  <SelectItem value="company">{t('auth.company')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.sending') : t('auth.resetPassword')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/jobseeker')}
                className="text-sm"
              >
                {t('auth.backToLogin')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword; 