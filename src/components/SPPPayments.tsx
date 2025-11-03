import { useState, useEffect } from 'react';
import { supabase, Student, Transaction } from '../lib/supabase';
import { Plus, Search, DollarSign } from 'lucide-react';
import { handleCurrencyInput, parseThousandSeparator } from '../lib/formatters';

export default function SPPPayments() {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_method: 'Tunai',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, transactionsRes] = await Promise.all([
        supabase.from('students').select('*').eq('status', 'active').order('full_name'),
        supabase
          .from('transactions')
          .select('*')
          .eq('transaction_type', 'spp')
          .order('transaction_date', { ascending: false })
          .limit(50),
      ]);

      setStudents(studentsRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const receiptNumber = `SPP-${Date.now()}`;
      const { error } = await supabase.from('transactions').insert([
        {
          transaction_type: 'spp',
          student_id: formData.student_id,
          amount: parseThousandSeparator(formData.amount),
          payment_method: formData.payment_method,
          description: formData.description,
          receipt_number: receiptNumber,
          transaction_date: formData.transaction_date,
        },
      ]);

      if (error) throw error;

      alert(`Pembayaran SPP berhasil dicatat! No. Kwitansi: ${receiptNumber}`);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Gagal menyimpan pembayaran');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '',
      payment_method: 'Tunai',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.full_name} (${student.nim})` : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Pembayaran SPP</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Batal' : 'Catat Pembayaran'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-emerald-50 rounded-lg p-6 mb-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">Catat Pembayaran SPP</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Santri</label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Pilih Santri</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {student.nim}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => handleCurrencyInput(e.target.value, (value) => setFormData({ ...formData, amount: value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                placeholder="1.000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="SPP Bulan..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">No. Kwitansi</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Santri</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Metode</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{transaction.transaction_date}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {transaction.receipt_number}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {transaction.student_id ? getStudentName(transaction.student_id) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                    {formatCurrency(Number(transaction.amount))}
                  </td>
                  <td className="px-4 py-3 text-sm">{transaction.payment_method}</td>
                  <td className="px-4 py-3 text-sm">{transaction.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">Belum ada pembayaran SPP</div>
          )}
        </div>
      )}
    </div>
  );
}
