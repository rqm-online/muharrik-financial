import { useState, useEffect } from 'react';
import { supabase, Profile } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getUserProfile } from './lib/auth';
import Login from './components/Login';
import AdminApp from './components/AdminApp';
import SantriApp from './components/SantriApp';
import GuruApp from './components/GuruApp';
import KomiteApp from './components/KomiteApp';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // CRITICAL: No async operations in this callback (Supabase best practice)
      // Just update session state, profile will be fetched separately
      setSession(session);
      if (!session) {
        setProfile(null);
      } else {
        // Trigger profile fetch outside of callback
        fetchUserProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear session on error to show login page
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-xl text-emerald-700">Memuat...</div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Login />;
  }

  // Route to appropriate dashboard based on role
  if (profile.role === 'santri') {
    return <SantriApp profile={profile} />;
  }

  if (profile.role === 'guru') {
    return <GuruApp profile={profile} />;
  }

  if (profile.role === 'komite') {
    return <KomiteApp profile={profile} />;
  }

  // Default to admin
  return <AdminApp profile={profile} />;
}

export default App;
