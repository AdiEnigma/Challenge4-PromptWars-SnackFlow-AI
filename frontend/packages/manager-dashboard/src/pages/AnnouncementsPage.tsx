import React from 'react';
import { Layout } from '@snackflow/shared';
import AnnouncementCreator from '../components/AnnouncementCreator';

const AnnouncementsPage: React.FC = () => {
  return (
    <Layout
      title="Announcements"
      navItems={[
        { label: 'Overview', path: '/' },
        { label: 'Restocking', path: '/restocking' },
        { label: 'Announcements', path: '/announcements' },
        { label: 'Analytics', path: '/analytics' },
      ]}
    >
      <AnnouncementCreator />
    </Layout>
  );
};

export default AnnouncementsPage;
