import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
          const preference = (typeof window !== 'undefined'
            ? localStorage.getItem('job_seeker_registration_preference')
            : null) as 'engineer' | 'general' | null;

          if (preference && types.includes(preference)) {
            navigate(preference === 'general' ? '/jobseeker/my-page-general' : '/jobseeker/my-page-engineer', {
              replace: true
            });
            return;
          }

          if (types.includes('engineer') && !types.includes('general')) {
            localStorage.setItem('job_seeker_registration_preference', 'engineer');
            navigate('/jobseeker/my-page-engineer', { replace: true });
          } else if (!types.includes('engineer') && types.includes('general')) {
            localStorage.setItem('job_seeker_registration_preference', 'general');
            navigate('/jobseeker/my-page-general', { replace: true });
          } else if (types.includes('engineer')) {
            localStorage.setItem('job_seeker_registration_preference', 'engineer');
            navigate('/jobseeker/my-page-engineer', { replace: true });
          } else if (types.includes('general')) {
            localStorage.setItem('job_seeker_registration_preference', 'general');
            navigate('/jobseeker/my-page-general', { replace: true });
          } else {
            navigate('/jobseeker/login', { replace: true });
          }
        } else {
          navigate('/jobseeker/login', { replace: true });
        }
      } catch {
        navigate('/jobseeker/login', { replace: true });
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