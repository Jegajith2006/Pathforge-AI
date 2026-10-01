import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

/**
 * ProtectedLayout component
 * Wraps all internal platform screens with AppLayout and renders child route elements.
 */
export const ProtectedLayout = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default ProtectedLayout;
