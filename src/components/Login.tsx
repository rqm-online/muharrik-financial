import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import RegistrationSuccess from './RegistrationSuccess';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error messages in Indonesian
      if (error.message.includes('Invalid login credentials')) {
        setError('Email atau password salah. Silakan coba lagi.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Silakan cek email Anda.');
      } else {
        setError('Gagal masuk. Silakan coba lagi.');
      }
      setLoading(false);
    } else {
      setSuccess('Login berhasil! Mengalihkan...');
      // The auth state change will handle navigation
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama!');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'santri', // Default role for new registrations
          full_name: email.split('@')[0] // Default name from email
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Email sudah terdaftar. Silakan gunakan email lain atau login.');
      } else if (error.message.includes('Password should be')) {
        setError('Password harus minimal 6 karakter.');
      } else {
        setError('Gagal mendaftar. Silakan coba lagi.');
      }
      setLoading(false);
      return;
    }

    // Success - show registration success screen
    setLoading(false);
    setRegisteredEmail(email);
    setRegistrationSuccess(true);
    
    // Clear form
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleResetToLogin = () => {
    setRegistrationSuccess(false);
    setRegisteredEmail('');
    setError('');
    setSuccess('');
  };

  // Show registration success screen
  if (registrationSuccess) {
    return (
      <RegistrationSuccess 
        email={registeredEmail} 
        onReset={handleResetToLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">Pondok Pesantren Muharrik</h1>
          <p className="text-emerald-600">Sistem Manajemen Keuangan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="admin@muharrik.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800 flex items-start gap-2">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Memuat...' : 'Masuk'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Daftar
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Gunakan email dan password untuk mengakses sistem</p>
        </div>
      </div>
    </div>
  );
}
