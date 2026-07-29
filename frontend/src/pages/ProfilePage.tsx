// src/pages/ProfilePage.tsx
// Client profile page

import React from 'react';
import { User, Mail, Building, Calendar, Shield } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { authService } from '@/services/authService';

const ProfilePage: React.FC = () => {
  const client = authService.getSavedClient();

  if (!client) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your account information</p>
      </div>

      <div className="max-w-xl">
        {/* Avatar + Name */}
        <div className="glass-card p-6 mb-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-brand">
            {client.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{client.full_name}</h2>
            <p className="text-gray-400 text-sm">{client.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={client.is_active ? 'badge-green' : 'badge-red'}>
                {client.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className={client.is_verified ? 'badge-blue' : 'badge-gray'}>
                {client.is_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-white font-bold border-b border-white/5 pb-4">Account Details</h3>

          {[
            { icon: User,     label: 'Full Name',   value: client.full_name },
            { icon: Mail,     label: 'Email',        value: client.email },
            { icon: Building, label: 'Company',      value: client.company_name || 'Not specified' },
            { icon: Calendar, label: 'Member Since', value: new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
            { icon: Shield,   label: 'Account ID',   value: client.id.slice(0, 16) + '...' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <item.icon size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">{item.label}</p>
                <p className="text-white text-sm font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
