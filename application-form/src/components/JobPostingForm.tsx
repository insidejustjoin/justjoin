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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { jobPostingsRepository, CreateJobPostingData } from '@/integrations/postgres';

const jobPostingSchema = z.object({
  title: z.string().min(1, '求人タイトルは必須です'),
  description: z.string().min(10, '求人説明は10文字以上で入力してください'),
  requirements: z.string().min(1, '必要なスキル・経験は必須です'),
  salary_min: z.number().min(0, '給与は0以上で入力してください'),
  salary_max: z.number().min(0, '給与は0以上で入力してください'),
  location: z.string().min(1, '勤務地は必須です'),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  remote_work: z.boolean()
}).refine((data) => data.salary_max >= data.salary_min, {
  message: '最大給与は最小給与以上で入力してください',
  path: ['salary_max']
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

interface JobPostingFormProps {
  companyId: string;
  onSuccess?: () => void;
}

export function JobPostingForm({ companyId, onSuccess }: JobPostingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      job_type: 'full_time',
      remote_work: false,
      salary_min: 300000,
      salary_max: 500000
    }
  });

  const onSubmit = async (data: JobPostingFormData) => {
    setIsLoading(true);
    try {
      const jobPostingData: CreateJobPostingData = {
        company_id: companyId,
        title: data.title,
        description: data.description,
        requirements: data.requirements.split(',').map(req => req.trim()),
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        location: data.location,
        job_type: data.job_type,
        remote_work: data.remote_work,
        status: 'active'
      };

      await jobPostingsRepository.create(jobPostingData);
      toast.success('求人情報の投稿が完了しました！');
      onSuccess?.();
    } catch (error) {
      console.error('求人情報投稿エラー:', error);
      toast.error('求人情報の投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>求人情報投稿</CardTitle>
        <CardDescription>
          新しい求人情報を投稿して、優秀な人材を見つけましょう
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">求人タイトル *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="シニアフロントエンドエンジニア"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">求人説明 *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="求人の詳細な説明を入力してください"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">必要なスキル・経験 *</Label>
            <Textarea
              id="requirements"
              {...register('requirements')}
              placeholder="React, TypeScript, 3年以上の経験（カンマ区切りで入力）"
              rows={3}
            />
            {errors.requirements && (
              <p className="text-sm text-red-500">{errors.requirements.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">最小給与（万円） *</Label>
              <Input
                id="salary_min"
                type="number"
                {...register('salary_min', { valueAsNumber: true })}
                placeholder="300"
              />
              {errors.salary_min && (
                <p className="text-sm text-red-500">{errors.salary_min.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_max">最大給与（万円） *</Label>
              <Input
                id="salary_max"
                type="number"
                {...register('salary_max', { valueAsNumber: true })}
                placeholder="500"
              />
              {errors.salary_max && (
                <p className="text-sm text-red-500">{errors.salary_max.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">勤務地 *</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="東京都渋谷区"
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_type">雇用形態 *</Label>
            <Select onValueChange={(value) => setValue('job_type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="雇用形態を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">正社員</SelectItem>
                <SelectItem value="part_time">パートタイム</SelectItem>
                <SelectItem value="contract">契約社員</SelectItem>
                <SelectItem value="internship">インターン</SelectItem>
              </SelectContent>
            </Select>
            {errors.job_type && (
              <p className="text-sm text-red-500">{errors.job_type.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote_work"
              {...register('remote_work')}
              onCheckedChange={(checked) => setValue('remote_work', checked as boolean)}
            />
            <Label htmlFor="remote_work">リモートワーク可能</Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '投稿中...' : '求人情報を投稿'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 