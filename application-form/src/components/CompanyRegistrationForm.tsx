import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { companiesRepository, CreateCompanyData } from '@/integrations/postgres';

const companySchema = z.object({
  company_name: z.string().min(1, '会社名は必須です'),
  industry: z.string().min(1, '業界は必須です'),
  company_size: z.enum(['startup', 'small', 'medium', 'large']),
  founded_year: z.number().min(1900).max(new Date().getFullYear()),
  website: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  description: z.string().min(10, '会社説明は10文字以上で入力してください'),
  address: z.string().min(1, '住所は必須です'),
  phone: z.string().min(1, '電話番号は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  logo_url: z.string().url('有効なURLを入力してください').optional().or(z.literal(''))
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyRegistrationFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function CompanyRegistrationForm({ userId, onSuccess }: CompanyRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_size: 'medium',
      founded_year: new Date().getFullYear()
    }
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);
    try {
      const companyData: CreateCompanyData = {
        user_id: userId,
        company_name: data.company_name,
        industry: data.industry,
        company_size: data.company_size,
        founded_year: data.founded_year,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website || undefined,
        logo_url: data.logo_url || undefined
      };

      await companiesRepository.create(companyData);
      toast.success('企業登録が完了しました！');
      onSuccess?.();
    } catch (error) {
      console.error('企業登録エラー:', error);
      toast.error('企業登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>企業登録</CardTitle>
        <CardDescription>
          企業情報を入力して、求人情報の投稿を開始しましょう
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">会社名 *</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                placeholder="株式会社サンプル"
              />
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">業界 *</Label>
              <Input
                id="industry"
                {...register('industry')}
                placeholder="IT・ソフトウェア"
              />
              {errors.industry && (
                <p className="text-sm text-red-500">{errors.industry.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">会社規模 *</Label>
              <Select onValueChange={(value) => setValue('company_size', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="会社規模を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">スタートアップ（1-10名）</SelectItem>
                  <SelectItem value="small">小規模（11-50名）</SelectItem>
                  <SelectItem value="medium">中規模（51-200名）</SelectItem>
                  <SelectItem value="large">大規模（201名以上）</SelectItem>
                </SelectContent>
              </Select>
              {errors.company_size && (
                <p className="text-sm text-red-500">{errors.company_size.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="founded_year">設立年 *</Label>
              <Input
                id="founded_year"
                type="number"
                {...register('founded_year', { valueAsNumber: true })}
                placeholder="2020"
              />
              {errors.founded_year && (
                <p className="text-sm text-red-500">{errors.founded_year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Webサイト</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">ロゴURL</Label>
              <Input
                id="logo_url"
                {...register('logo_url')}
                placeholder="https://example.com/logo.png"
              />
              {errors.logo_url && (
                <p className="text-sm text-red-500">{errors.logo_url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">会社説明 *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="会社の特徴や事業内容について説明してください"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">住所 *</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="東京都渋谷区1-1-1"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号 *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+81-3-1234-5678"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="hr@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '登録中...' : '企業を登録'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 