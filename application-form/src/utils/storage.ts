
import { JobSeeker } from '../types/JobSeeker';

const STORAGE_KEY = 'jobSeekers';

export const saveJobSeeker = (jobSeeker: JobSeeker): void => {
  const existing = getJobSeekers();
  const updated = [...existing, jobSeeker];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getJobSeekers = (): JobSeeker[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const filterJobSeekersBySkills = (jobSeekers: JobSeeker[], skillFilters: string[]): JobSeeker[] => {
  if (skillFilters.length === 0) return jobSeekers;
  
  return jobSeekers.filter(seeker =>
    skillFilters.some(filter =>
      seeker.skills.some(skill =>
        skill.toLowerCase().includes(filter.toLowerCase())
      )
    )
  );
};
