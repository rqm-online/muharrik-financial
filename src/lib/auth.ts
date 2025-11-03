import { supabase, Profile, UserRole } from './supabase';

export const getUserProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const updateUserProfile = async (updates: Partial<Profile>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
};

export const logUserActivity = async (
  actionType: string,
  module?: string,
  description?: string,
  metadata?: any
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('user_activities').insert([
    {
      user_id: user.id,
      action_type: actionType,
      module,
      description,
      metadata,
    },
  ]);
};

export const canAccessModule = (userRole: UserRole, module: string): boolean => {
  const moduleAccess: Record<string, UserRole[]> = {
    dashboard: ['admin', 'santri', 'guru'],
    students: ['admin'],
    teachers: ['admin'],
    spp: ['admin'],
    savings: ['admin', 'santri'],
    expenses: ['admin'],
    donations: ['admin'],
    reports: ['admin'],
    cash: ['admin'],
    roles: ['admin'],
    'my-profile': ['admin', 'santri', 'guru'],
    'my-savings': ['santri'],
    'my-payments': ['santri'],
    'my-salary': ['guru'],
    'my-assignments': ['guru'],
  };

  return moduleAccess[module]?.includes(userRole) || false;
};
