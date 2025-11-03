import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, ChevronDown, Download, RefreshCw, X, Check } from 'lucide-react';

interface PaymentStatus {
  id: string;
  student_id: string;
  year: number;
  month: number;
  spp_paid: number;
  cash_paid: number;
  total_paid: number;
  status: 'paid' | 'unpaid' | 'partial';
}

interface Student {
  id: string;
  nim: string;
  full_name: string;
  class: string;
}

type MonitoringTab = 'spp' | 'kas';

interface PaymentMonitoringProps {
  komiteMode?: boolean;
}

export default function PaymentMonitoring({ komiteMode = false }: PaymentMonitoringProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentData, setPaymentData] = useState<Record<string, PaymentStatus[]>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<MonitoringTab>(komiteMode ? 'kas' : 'spp');

  const years = Array.from({ length: 76 }, (_, i) => 2025 + i); // 2025-2100
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, nim, full_name, class')
        .eq('status', 'active')
        .order('full_name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch payment status for the year
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_status')
        .select('*')
        .eq('year', selectedYear);

      if (paymentsError) throw paymentsError;

      // Organize by student
      const organized: Record<string, PaymentStatus[]> = {};
      (paymentsData || []).forEach((payment) => {
        if (!organized[payment.student_id]) {
          organized[payment.student_id] = [];
        }
        organized[payment.student_id].push(payment);
      });

      setPaymentData(organized);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      alert('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const syncPaymentStatus = async () => {
    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-payment-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ year: selectedYear }),
        }
      );

      if (!response.ok) throw new Error('Sync failed');

      alert('Status pembayaran berhasil disinkronkan!');
      fetchData();
    } catch (error) {
      console.error('Error syncing payment status:', error);
      alert('Gagal menyinkronkan status pembayaran');
    } finally {
      setSyncing(false);
    }
  };

  const getPaymentStatus = (payment: PaymentStatus | undefined, type: MonitoringTab): boolean => {
    if (!payment) return false;
    
    if (type === 'spp') {
      return payment.spp_paid > 0;
    } else {
      return payment.cash_paid > 0;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = () => {
    const paymentType = activeTab === 'spp' ? 'SPP' : 'Kas';
    // Create CSV content
    let csv = 'NIM,Nama Santri,Kelas,';
    months.forEach(month => {
      csv += `${month},`;
    });
    csv += '\n';

    students.forEach(student => {
      csv += `${student.nim},${student.full_name},${student.class},`;
      for (let month = 1; month <= 12; month++) {
        const payment = paymentData[student.id]?.find(p => p.month === month);
        const isPaid = getPaymentStatus(payment, activeTab);
        csv += `${isPaid ? 'Lunas' : 'Belum Bayar'},`;
      }
      csv += '\n';
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `monitoring_${paymentType.toLowerCase()}_${selectedYear}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-emerald-600">Memuat data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Monitoring Pembayaran</h2>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none px-4 py-2 pr-10 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>

          <button
            onClick={syncPaymentStatus}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Menyinkronkan...' : 'Sinkronkan'}
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!komiteMode && (
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('spp')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'spp'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-emerald-600'
            }`}
          >
            Monitoring SPP (Wajib)
          </button>
          <button
            onClick={() => setActiveTab('kas')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'kas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            Monitoring Kas (Diperlukan)
          </button>
        </div>
      )}
      
      {komiteMode && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-600 pb-3 border-b-2 border-blue-600">
            Monitoring Kas Santri
          </h3>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white border-2 border-emerald-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Keterangan:</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
              <Check size={16} className="text-green-600" strokeWidth={3} />
            </div>
            <span className="text-sm">Sudah Bayar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center">
              <X size={16} className="text-red-600" strokeWidth={3} />
            </div>
            <span className="text-sm">Belum Bayar</span>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={activeTab === 'spp' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}>
              <tr>
                <th className={`px-4 py-3 text-left sticky left-0 z-10 ${activeTab === 'spp' ? 'bg-emerald-600' : 'bg-blue-600'}`}>NIM</th>
                <th className={`px-4 py-3 text-left sticky left-[80px] z-10 ${activeTab === 'spp' ? 'bg-emerald-600' : 'bg-blue-600'}`}>Nama Santri</th>
                <th className="px-4 py-3 text-left">Kelas</th>
                {months.map((month, idx) => (
                  <th key={idx} className="px-4 py-3 text-center min-w-[100px]">
                    <Calendar size={16} className="inline mr-1" />
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, studentIdx) => (
                <tr key={student.id} className={studentIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm sticky left-0 bg-inherit z-10 border-r">{student.nim}</td>
                  <td className="px-4 py-3 text-sm font-medium sticky left-[80px] bg-inherit z-10 border-r">{student.full_name}</td>
                  <td className="px-4 py-3 text-sm">{student.class}</td>
                  {months.map((_, monthIdx) => {
                    const month = monthIdx + 1;
                    const payment = paymentData[student.id]?.find(p => p.month === month);
                    const isPaid = getPaymentStatus(payment, activeTab);
                    const amount = payment ? (activeTab === 'spp' ? payment.spp_paid : payment.cash_paid) : 0;
                    
                    return (
                      <td key={monthIdx} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${
                            isPaid ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {isPaid ? (
                              <Check size={20} className="text-green-600" strokeWidth={3} />
                            ) : (
                              <X size={20} className="text-red-600" strokeWidth={3} />
                            )}
                          </div>
                          {amount > 0 && (
                            <div className="text-xs text-gray-600">
                              {formatCurrency(amount)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {students.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data santri aktif
        </div>
      )}
    </div>
  );
}
