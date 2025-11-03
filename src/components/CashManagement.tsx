import { useState, useEffect } from 'react';
import { supabase, CashTransaction } from '../lib/supabase';
import { Plus, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { handleCurrencyInput, parseThousandSeparator } from '../lib/formatters';

interface Student {
  id: string;
  nim: string;
  full_name: string;
}

export default function CashManagement() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'receipt' | 'disbursement'>('receipt');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    student_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
    fetchStudents();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select(`
          *,
          student:students(nim, full_name)
        `)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching cash transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nim, full_name')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const transactionData: any = {
        transaction_type: transactionType,
        amount: parseThousandSeparator(formData.amount),
        category: formData.category,
        description: formData.description,
        transaction_date: formData.transaction_date,
      };

      // Add student_id if selected
      if (formData.student_id) {
        transactionData.student_id = formData.student_id;
      }

      const { error } = await supabase.from('cash_transactions').insert([transactionData]);

      if (error) throw error;

      alert('Transaksi kas berhasil dicatat!');
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error('Error saving cash transaction:', error);
      alert('Gagal menyimpan transaksi');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      description: '',
      student_id: '',
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

  const totalReceipts = transactions
    .filter((t) => t.transaction_type === 'receipt')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDisbursements = transactions
    .filter((t) => t.transaction_type === 'disbursement')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const cashBalance = totalReceipts - totalDisbursements;

  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Halaman Kas</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Batal' : 'Transaksi Kas'}
        </button>
      </div>

      {/* Cash Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="text-blue-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Saldo Kas</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(cashBalance)}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Penerimaan</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceipts)}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-red-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Pengeluaran</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDisbursements)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Catat Transaksi Kas</h3>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTransactionType('receipt')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                transactionType === 'receipt'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Penerimaan Kas
            </button>
            <button
              onClick={() => setTransactionType('disbursement')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                transactionType === 'disbursement'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pengeluaran Kas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => handleCurrencyInput(e.target.value, (value) => setFormData({ ...formData, amount: value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="1.000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="SPP, Gaji, Operasional, dll"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users size={16} className="inline mr-1" />
                Santri (Opsional)
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Santri (Opsional) --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nim} - {student.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Keterangan tambahan (opsional)"
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
                className={`px-4 py-2 text-white rounded-lg ${
                  transactionType === 'receipt'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table with Pagination */}
      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Tipe</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Kategori</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Santri</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{transaction.transaction_date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.transaction_type === 'receipt'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.transaction_type === 'receipt' ? 'Penerimaan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{transaction.category || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {(transaction as any).student
                        ? `${(transaction as any).student.nim} - ${(transaction as any).student.full_name}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{transaction.description}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      <span
                        className={
                          transaction.transaction_type === 'receipt' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {transaction.transaction_type === 'receipt' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">Belum ada transaksi kas</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
                Sebelumnya
              </button>
              <span className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
