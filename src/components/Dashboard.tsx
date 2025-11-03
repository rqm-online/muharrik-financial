import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, Users, PiggyBank, Receipt, Heart } from 'lucide-react';
import MetricSkeleton from './ui/MetricSkeleton';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSPP: 0,
    totalSavings: 0,
    totalExpenses: 0,
    totalDonations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total students
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total SPP this month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: sppData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('transaction_type', 'spp')
        .gte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      // Get total savings
      const { data: savingsData } = await supabase
        .from('savings_accounts')
        .select('current_balance');

      // Get total expenses this month
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      // Get total donations this month
      const { data: donationsData } = await supabase
        .from('donations')
        .select('amount')
        .gte('donation_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      setStats({
        totalStudents: studentsCount || 0,
        totalSPP: sppData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        totalSavings: savingsData?.reduce((sum, s) => sum + Number(s.current_balance), 0) || 0,
        totalExpenses: expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        totalDonations: donationsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Santri Aktif',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pemasukan SPP (Bulan Ini)',
      value: formatCurrency(stats.totalSPP),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Total Tabungan Santri',
      value: formatCurrency(stats.totalSavings),
      icon: PiggyBank,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pengeluaran (Bulan Ini)',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Donasi ZISWAF (Bulan Ini)',
      value: formatCurrency(stats.totalDonations),
      icon: Heart,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-emerald-800 mb-6">Dashboard Keuangan</h2>
        <MetricSkeleton count={6} />
      </div>
    );
  }

  const netIncome = stats.totalSPP + stats.totalDonations - stats.totalExpenses;

  return (
    <div>
      <h2 className="text-2xl font-bold text-emerald-800 mb-6">Dashboard Keuangan</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-xl p-6 shadow-md border border-gray-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-lg`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Net Income Summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Ringkasan Keuangan Bulan Ini</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-emerald-100 text-sm">Total Pemasukan</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSPP + stats.totalDonations)}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-sm">Total Pengeluaran</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-sm">Saldo Bersih</p>
            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-white' : 'text-red-200'}`}>
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-emerald-800 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 font-medium transition-colors border border-emerald-200">
            <Receipt size={24} className="mx-auto mb-2" />
            Catat Pembayaran SPP
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium transition-colors border border-purple-200">
            <PiggyBank size={24} className="mx-auto mb-2" />
            Setor Tabungan
          </button>
          <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 font-medium transition-colors border border-red-200">
            <TrendingDown size={24} className="mx-auto mb-2" />
            Catat Pengeluaran
          </button>
          <button className="p-4 bg-pink-50 hover:bg-pink-100 rounded-lg text-pink-700 font-medium transition-colors border border-pink-200">
            <Heart size={24} className="mx-auto mb-2" />
            Terima Donasi
          </button>
        </div>
      </div>
    </div>
  );
}
