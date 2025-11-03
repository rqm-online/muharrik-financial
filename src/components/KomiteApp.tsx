import { useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import CashManagement from './CashManagement';
import StudentSavings from './StudentSavings';
import PaymentMonitoring from './PaymentMonitoring';
import { LayoutDashboard, Wallet, PiggyBank, CalendarCheck, LogOut, Users } from 'lucide-react';

type MenuPage = 'dashboard' | 'cash' | 'savings' | 'monitoring';

interface KomiteAppProps {
  profile: Profile;
}

export default function KomiteApp({ profile }: KomiteAppProps) {
  const [currentPage, setCurrentPage] = useState<MenuPage>('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: 'dashboard' as MenuPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cash' as MenuPage, label: 'Uang Kas Santri', icon: Wallet },
    { id: 'savings' as MenuPage, label: 'Tabungan Santri', icon: PiggyBank },
    { id: 'monitoring' as MenuPage, label: 'Monitoring Kas', icon: CalendarCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-emerald-800">Pondok Pesantren Muharrik</h1>
              <p className="text-sm text-emerald-600">Sistem Keuangan Santri - Komite</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{profile.full_name || profile.email}</p>
                <p className="text-xs text-gray-500">Komite</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <nav className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                    currentPage === item.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Icon size={24} className="mb-1" />
                  <span className="text-xs sm:text-sm font-medium text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {currentPage === 'dashboard' && <KomiteDashboard />}
          {currentPage === 'cash' && <CashManagement />}
          {currentPage === 'savings' && <StudentSavings />}
          {currentPage === 'monitoring' && <KomiteMonitoring />}
        </div>
      </div>
    </div>
  );
}

function KomiteDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCash: 0,
    totalSavings: 0,
    recentTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useState(() => {
    async function fetchStats() {
      try {
        // Get student count
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get total cash balance
        const { data: cashData } = await supabase
          .from('cash_transactions')
          .select('amount, transaction_type');

        const cashBalance = cashData?.reduce((sum, t) => {
          return t.transaction_type === 'receipt' 
            ? sum + Number(t.amount) 
            : sum - Number(t.amount);
        }, 0) || 0;

        // Get total savings
        const { data: savingsData } = await supabase
          .from('savings_accounts')
          .select('balance');

        const totalSavings = savingsData?.reduce((sum, s) => sum + Number(s.balance), 0) || 0;

        // Get recent transactions count (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentCount } = await supabase
          .from('cash_transactions')
          .select('*', { count: 'exact', head: true })
          .gte('transaction_date', sevenDaysAgo.toISOString().split('T')[0]);

        setStats({
          totalStudents: studentCount || 0,
          totalCash: cashBalance,
          totalSavings: totalSavings,
          recentTransactions: recentCount || 0,
        });
      } catch (error) {
        console.error('Error fetching komite stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-emerald-800 mb-6">Dashboard Komite</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-500 rounded"></div>
              </div>
              <div className="h-3 bg-gray-500 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-600 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-emerald-800 mb-6">Dashboard Komite</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users size={32} />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Santri Aktif</p>
          <p className="text-3xl font-bold">{stats.totalStudents}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Wallet size={32} />
          </div>
          <p className="text-sm opacity-90 mb-1">Saldo Kas</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalCash)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <PiggyBank size={32} />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Tabungan</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CalendarCheck size={32} />
          </div>
          <p className="text-sm opacity-90 mb-1">Transaksi (7 Hari)</p>
          <p className="text-3xl font-bold">{stats.recentTransactions}</p>
        </div>
      </div>

      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded">
        <h3 className="font-semibold text-emerald-800 mb-2">Selamat Datang, Anggota Komite</h3>
        <p className="text-sm text-emerald-700">
          Anda memiliki akses untuk mengelola uang kas santri dan tabungan santri. 
          Gunakan menu navigasi di atas untuk mengakses fitur yang tersedia.
        </p>
      </div>
    </div>
  );
}

function KomiteMonitoring() {
  return (
    <div>
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Monitoring Kas Santri</h3>
        <p className="text-sm text-blue-700">
          Tampilan monitoring khusus untuk pembayaran kas santri. Komite tidak memiliki akses ke monitoring SPP.
        </p>
      </div>
      
      <PaymentMonitoring komiteMode={true} />
    </div>
  );
}
