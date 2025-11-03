import { useState, useEffect } from 'react';
import { supabase, Profile, Student, SavingsAccount, Transaction } from '../lib/supabase';
import { LogOut, User, PiggyBank, Receipt, FileText } from 'lucide-react';

type MenuPage = 'dashboard' | 'profile' | 'savings' | 'payments' | 'reports';

interface SantriAppProps {
  profile: Profile;
}

export default function SantriApp({ profile }: SantriAppProps) {
  const [currentPage, setCurrentPage] = useState<MenuPage>('dashboard');
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [savingsAccount, setSavingsAccount] = useState<SavingsAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    if (!profile.student_id) {
      setLoading(false);
      return;
    }

    try {
      // Get student info
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', profile.student_id)
        .single();

      // Get savings account
      const { data: savings } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('student_id', profile.student_id)
        .single();

      // Get transactions
      const { data: trans } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', profile.student_id)
        .order('transaction_date', { ascending: false });

      setStudentData(student);
      setSavingsAccount(savings);
      setTransactions(trans || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const menuItems = [
    { id: 'dashboard' as MenuPage, label: 'Dashboard', icon: FileText },
    { id: 'profile' as MenuPage, label: 'Profil Saya', icon: User },
    { id: 'savings' as MenuPage, label: 'Tabungan Saya', icon: PiggyBank },
    { id: 'payments' as MenuPage, label: 'Riwayat Pembayaran', icon: Receipt },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-blue-700">Memuat...</div>
      </div>
    );
  }

  const sppTransactions = transactions.filter((t) => t.transaction_type === 'spp');
  const savingsTransactions = transactions.filter((t) =>
    ['savings_deposit', 'savings_withdrawal'].includes(t.transaction_type)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Pondok Pesantren Muharrik</h1>
              <p className="text-sm text-blue-600">Portal Santri</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{studentData?.full_name || profile.full_name}</p>
                <p className="text-xs text-gray-500">{studentData?.nim || 'Santri'}</p>
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
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
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
          {currentPage === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-800 mb-6">Dashboard Santri</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <PiggyBank className="text-purple-600" size={32} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Saldo Tabungan</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(savingsAccount?.current_balance || 0)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Pembayaran SPP</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(sppTransactions.reduce((sum, t) => sum + Number(t.amount), 0))}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Transaksi</h3>
                  <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Transaksi Terakhir</h3>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((trans) => (
                    <div key={trans.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {trans.transaction_type === 'spp'
                            ? 'Pembayaran SPP'
                            : trans.transaction_type === 'savings_deposit'
                            ? 'Setoran Tabungan'
                            : 'Penarikan Tabungan'}
                        </p>
                        <p className="text-xs text-gray-500">{trans.transaction_date}</p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          trans.transaction_type === 'savings_withdrawal'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {trans.transaction_type === 'savings_withdrawal' ? '-' : '+'}
                        {formatCurrency(Number(trans.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentPage === 'profile' && studentData && (
            <div>
              <h2 className="text-2xl font-bold text-blue-800 mb-6">Profil Saya</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">NIM</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.nim}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Lengkap</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Jenis Kelamin</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.gender || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Tanggal Lahir</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.date_of_birth || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Kelas</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.class || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Kamar</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.room_assignment || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Wali</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.parent_name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Telepon Wali</label>
                    <p className="text-lg font-semibold text-gray-800">{studentData.parent_phone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'savings' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-800 mb-6">Tabungan Saya</h2>
              <div className="bg-purple-50 rounded-lg p-6 mb-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Saldo Tabungan</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(savingsAccount?.current_balance || 0)}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-blue-800 mb-4">Riwayat Transaksi Tabungan</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Tipe</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Jumlah</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {savingsTransactions.map((trans) => (
                      <tr key={trans.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{trans.transaction_date}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              trans.transaction_type === 'savings_deposit'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {trans.transaction_type === 'savings_deposit' ? 'Setoran' : 'Penarikan'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          <span
                            className={
                              trans.transaction_type === 'savings_deposit'
                                ? 'text-green-600'
                                : 'text-orange-600'
                            }
                          >
                            {trans.transaction_type === 'savings_deposit' ? '+' : '-'}
                            {formatCurrency(Number(trans.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{trans.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {savingsTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Belum ada transaksi tabungan</div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'payments' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-800 mb-6">Riwayat Pembayaran SPP</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">No. Kwitansi</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">Jumlah</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">Metode</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sppTransactions.map((trans) => (
                      <tr key={trans.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{trans.transaction_date}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{trans.receipt_number}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {formatCurrency(Number(trans.amount))}
                        </td>
                        <td className="px-4 py-3 text-sm">{trans.payment_method}</td>
                        <td className="px-4 py-3 text-sm">{trans.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sppTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Belum ada pembayaran SPP</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
