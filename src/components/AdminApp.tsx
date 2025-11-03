import { useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import Dashboard from './Dashboard';
import StudentManagement from './StudentManagement';
import SPPPayments from './SPPPayments';
import StudentSavings from './StudentSavings';
import ExpenseManagement from './ExpenseManagement';
import DonationManagement from './DonationManagement';
import FinancialReports from './FinancialReports';
import TeacherManagement from './TeacherManagement';
import CashManagement from './CashManagement';
import RoleManagement from './RoleManagement';
import PaymentMonitoring from './PaymentMonitoring';
import { LayoutDashboard, Users, DollarSign, PiggyBank, Receipt, Heart, FileText, LogOut, UserCog, GraduationCap, Wallet, CalendarCheck } from 'lucide-react';

type MenuPage = 'dashboard' | 'students' | 'teachers' | 'spp' | 'savings' | 'expenses' | 'cash' | 'donations' | 'reports' | 'roles' | 'monitoring';

interface AdminAppProps {
  profile: Profile;
}

export default function AdminApp({ profile }: AdminAppProps) {
  const [currentPage, setCurrentPage] = useState<MenuPage>('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: 'dashboard' as MenuPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as MenuPage, label: 'Manajemen Santri', icon: Users },
    { id: 'teachers' as MenuPage, label: 'Manajemen Guru', icon: GraduationCap },
    { id: 'spp' as MenuPage, label: 'Pembayaran SPP', icon: DollarSign },
    { id: 'savings' as MenuPage, label: 'Tabungan Santri', icon: PiggyBank },
    { id: 'expenses' as MenuPage, label: 'Pengeluaran', icon: Receipt },
    { id: 'cash' as MenuPage, label: 'Halaman Kas', icon: Wallet },
    { id: 'donations' as MenuPage, label: 'Donasi ZISWAF', icon: Heart },
    { id: 'monitoring' as MenuPage, label: 'Monitoring Pembayaran', icon: CalendarCheck },
    { id: 'reports' as MenuPage, label: 'Laporan Keuangan', icon: FileText },
    { id: 'roles' as MenuPage, label: 'Manajemen Role', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-emerald-800">Pondok Pesantren Muharrik</h1>
              <p className="text-sm text-emerald-600">Sistem Manajemen Keuangan - Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{profile.full_name || profile.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'students' && <StudentManagement />}
          {currentPage === 'teachers' && <TeacherManagement />}
          {currentPage === 'spp' && <SPPPayments />}
          {currentPage === 'savings' && <StudentSavings />}
          {currentPage === 'expenses' && <ExpenseManagement />}
          {currentPage === 'cash' && <CashManagement />}
          {currentPage === 'donations' && <DonationManagement />}
          {currentPage === 'monitoring' && <PaymentMonitoring />}
          {currentPage === 'reports' && <FinancialReports />}
          {currentPage === 'roles' && <RoleManagement />}
        </div>
      </div>
    </div>
  );
}
