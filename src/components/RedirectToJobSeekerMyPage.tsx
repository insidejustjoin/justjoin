import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RedirectToJobSeekerMyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const doRedirect = async () => {
      if (!user || user.user_type !== 'job_seeker') {
        navigate('/jobseeker/login', { replace: true });
        setResolved(true);
        return;
      }
      try {
        const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
        const resp = await fetch(`${apiUrl}/api/jobseekers/registration-types/${user.id}`);
        if (resp.ok) {
          const json = await resp.json();
          const types: string[] = json?.types || [];
          if (types.includes('engineer') && !types.includes('general')) {
            navigate('/jobseeker/my-page-engineer', { replace: true });
          } else if (!types.includes('engineer') && types.includes('general')) {
            navigate('/jobseeker/my-page-general', { replace: true });
          } else {
            // 両方ある、または未設定 → 既存ページへ（選択UIは今後検討）
            navigate('/jobseeker/my-page', { replace: true });
          }
        } else {
          navigate('/jobseeker/my-page', { replace: true });
        }
      } catch {
        navigate('/jobseeker/my-page', { replace: true });
      } finally {
        setResolved(true);
      }
    };
    doRedirect();
  }, [user, navigate]);

  if (!resolved) return null;
  return null;
};

export default RedirectToJobSeekerMyPage; 