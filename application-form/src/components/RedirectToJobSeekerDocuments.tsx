import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RedirectToJobSeekerDocuments: React.FC = () => {
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const response = await fetch(`${apiUrl}/api/jobseekers/registration-types/${user.id}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        const json = response.ok ? await response.json() : null;
        const types: string[] = Array.isArray(json?.types) ? json.types : [];

        const storedPreference =
          (typeof window !== 'undefined'
            ? (localStorage.getItem('job_seeker_registration_preference') as 'engineer' | 'general' | null)
            : null) || null;

        const normalizedPreference =
          storedPreference === 'general' || storedPreference === 'engineer' ? storedPreference : null;

        const resolveTargetType = (): 'engineer' | 'general' | null => {
          if (normalizedPreference && types.includes(normalizedPreference)) {
            return normalizedPreference;
          }
          if (types.includes('engineer') && !types.includes('general')) {
            return 'engineer';
          }
          if (types.includes('general') && !types.includes('engineer')) {
            return 'general';
          }
          if (types.includes('engineer')) {
            return 'engineer';
          }
          if (types.includes('general')) {
            return 'general';
          }
          return null;
        };

        const targetType = resolveTargetType();

        if (targetType === 'general') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('job_seeker_registration_preference', 'general');
          }
          navigate('/jobseeker/documents-general', { replace: true });
        } else if (targetType === 'engineer') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('job_seeker_registration_preference', 'engineer');
          }
          navigate('/jobseeker/documents-engineer', { replace: true });
        } else {
          navigate('/jobseeker/login', { replace: true });
        }
      } catch (error) {
        console.warn('Failed to resolve registration types for documents redirect:', error);
        navigate('/jobseeker/login', { replace: true });
      } finally {
        setResolved(true);
      }
    };

    doRedirect();
  }, [user, navigate]);

  if (!resolved) {
    return null;
  }
  return null;
};

export default RedirectToJobSeekerDocuments;

