import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function useRegistrationTypeGuard(required: 'engineer' | 'general') {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user || user.user_type !== 'job_seeker') {
        navigate('/jobseeker/login', { replace: true });
        return;
      }
      try {
        const apiBase = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
        const resp = await fetch(`${apiBase}/api/jobseekers/registration-types/${user.id}`);
        if (!resp.ok) {
          navigate('/jobseeker/login', { replace: true });
          return;
        }
        const json = await resp.json();
        const types: string[] = Array.isArray(json?.types) ? json.types : [];
        if (!types.includes(required)) {
          // 要求タイプを保有していなければログインへ戻す
          navigate('/jobseeker/login', { replace: true });
        }
      } catch {
        navigate('/jobseeker/login', { replace: true });
      }
    };
    check();
  }, [user, required, navigate]);
}





