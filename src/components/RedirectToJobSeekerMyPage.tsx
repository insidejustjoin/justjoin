import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const RedirectToJobSeekerMyPage: React.FC = () => {
  return <Navigate to="/jobseeker/my-page" replace />;
};

export default RedirectToJobSeekerMyPage; 