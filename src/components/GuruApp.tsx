import { useState, useEffect } from 'react';
import { supabase, Profile, Teacher, SalaryPayment, TeacherAssignment } from '../lib/supabase';
import { LogOut, User, DollarSign, BookOpen, FileText } from 'lucide-react';

type MenuPage = 'dashboard' | 'profile' | 'salary' | 'assignments';

interface GuruAppProps {
  profile: Profile;
}

export default function GuruApp({ profile }: GuruAppProps) {
  const [currentPage, setCurrentPage] = useState<MenuPage>('dashboard');
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    if (!profile.teacher_id) {
      setLoading(false);
      return;
    }

    try {
      // Get teacher info
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', profile.teacher_id)
        .single();

      // Get salary payments
      const { data: payments } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('teacher_id', profile.teacher_id)
        .order('payment_date', { ascending: false });

      // Get assignments
      const { data: assigns } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('teacher_id', profile.teacher_id);

      setTeacherData(teacher);
      setSalaryPayments(payments || []);
      setAssignments(assigns || []);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
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
    { id: 'salary' as MenuPage, label: 'Informasi Gaji', icon: DollarSign },
    { id: 'assignments' as MenuPage, label: 'Penugasan Mengajar', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100">
        <div className="text-xl text-teal-700">Memuat...</div>
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthSalary = salaryPayments.find(
    (p) => p.payment_month === currentMonth && p.payment_year === currentYear
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-teal-800">Pondok Pesantren Muharrik</h1>
              <p className="text-sm text-teal-600">Portal Guru</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{teacherData?.full_name || profile.full_name}</p>
                <p className="text-xs text-gray-500">{teacherData?.nip || 'Guru'}</p>
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
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
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
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Dashboard Guru</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="text-teal-600" size={32} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Gaji Bulan Ini</h3>
                  <p className="text-2xl font-bold text-teal-600">
                    {thisMonthSalary ? formatCurrency(Number(thisMonthSalary.total_amount)) : '-'}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Gaji Pokok</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(teacherData?.base_salary || 0)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Mata Pelajaran</h3>
                  <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
                </div>
              </div>

              <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                <h3 className="text-lg font-semibold text-teal-800 mb-4">Riwayat Gaji Terakhir</h3>
                <div className="space-y-2">
                  {salaryPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Gaji {payment.payment_month}/{payment.payment_year}
                        </p>
                        <p className="text-xs text-gray-500">{payment.payment_date}</p>
                      </div>
                      <p className="text-sm font-semibold text-teal-600">
                        {formatCurrency(Number(payment.total_amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentPage === 'profile' && teacherData && (
            <div>
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Profil Saya</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">NIP</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.nip}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Lengkap</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Jenis Kelamin</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.gender || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Telepon</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.phone || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Kualifikasi</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.qualification || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Spesialisasi</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.specialization || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Tanggal Bergabung</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData.hire_date || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <p className="text-lg font-semibold text-gray-800">
                      {teacherData.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'salary' && (
            <div>
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Informasi Gaji</h2>
              <div className="bg-teal-50 rounded-lg p-6 mb-6 border border-teal-200">
                <h3 className="text-lg font-semibold text-teal-800 mb-2">Gaji Pokok</h3>
                <p className="text-3xl font-bold text-teal-600">
                  {formatCurrency(teacherData?.base_salary || 0)}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-teal-800 mb-4">Riwayat Pembayaran Gaji</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-teal-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">Periode</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">Gaji Pokok</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">Tambahan</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">Tanggal Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salaryPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {payment.payment_month}/{payment.payment_year}
                        </td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(Number(payment.base_amount))}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(Number(payment.additional_amount))}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-teal-600">
                          {formatCurrency(Number(payment.total_amount))}
                        </td>
                        <td className="px-4 py-3 text-sm">{payment.payment_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salaryPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Belum ada pembayaran gaji</div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'assignments' && (
            <div>
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Penugasan Mengajar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-teal-800 mb-2">{assignment.subject}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Kelas:</span> {assignment.class || '-'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Jam/Minggu:</span> {assignment.hours_per_week || '-'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tahun Akademik:</span> {assignment.academic_year || '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {assignments.length === 0 && (
                <div className="text-center py-8 text-gray-500">Belum ada penugasan mengajar</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
