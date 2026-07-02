import { UserProfile, UserDataPayload, AdminMasterFile } from '../types';

const STORAGE_KEY = 'typing_app_users_db_v1';

export const getLocalUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load local users', e);
  }
  return [];
};

export const saveLocalUsers = (users: UserProfile[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local users', e);
  }
};

export const upsertUser = (user: UserProfile) => {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.id === user.id || u.username === user.username);
  if (index >= 0) {
    // preserve ID if matched by username
    user.id = users[index].id;
    users[index] = user;
  } else {
    users.push(user);
  }
  saveLocalUsers(users);
};

export const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportUserData = (user: UserProfile) => {
  downloadFile(`${user.username.toLowerCase()}_data.json`, JSON.stringify(user, null, 2));
};

export const exportAdminData = () => {
  const users = getLocalUsers();
  const adminFile: AdminMasterFile = {
    export_date: new Date().toISOString(),
    users
  };
  downloadFile(`admin_master.json`, JSON.stringify(adminFile, null, 2));
};
