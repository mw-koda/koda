'use client';

import { useEffect, useMemo, useState } from 'react';
import InternProfileView from '@/components/intern-profile-view';
import { interns, roleToUserMap } from '@/lib/mock-data';

export default function InternProfilePage() {
  const [selectedRole, setSelectedRole] = useState<keyof typeof roleToUserMap>('intern');

  useEffect(() => {
    const role = (localStorage.getItem('selectedRole') || 'intern') as keyof typeof roleToUserMap;
    setSelectedRole(role);
  }, []);

  const currentUser = roleToUserMap[selectedRole] || roleToUserMap.intern;
  const internId = useMemo(() => {
    const match = interns.find(
      (intern) => intern.github === currentUser.github || intern.name === currentUser.name
    );
    return match?.id || interns[0]?.id;
  }, [currentUser]);

  return <InternProfileView internId={internId} backLabel="Dashboard" />;
}
