import { useState, useEffect } from 'react';
import { supabase, Expense } from '../lib/supabase';
import { Plus, Receipt, Trash2, User } from 'lucide-react';
import { handleCurrencyInput, parseThousandSeparator } from '../lib/formatters';

interface Teacher {
  id: string;
  nip: string;
  full_name: string;
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    expense_category: 'Program',
    amount: '',
    description: '',
    vendor_name: '',
    payment_method: 'Tunai',
    teacher_id: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchExpenses();
    fetchTeachers();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          teacher:teachers(nip, full_name)
        `)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, nip, full_name')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate teacher selection for Gaji Guru
    if (formData.expense_category === 'Gaji Guru' && !formData.teacher_id) {
      alert('Silakan pilih guru untuk pembayaran gaji');
      return;
    }

    try {
      const expenseData: any = {
        expense_category: formData.expense_category,
        amount: parseThousandSeparator(formData.amount),
        description: formData.description,
        vendor_name: formData.vendor_name,
        payment_method: formData.payment_method,
        expense_date: formData.expense_date,
        approval_status: 'approved',
      };

      // Add teacher_id if Gaji Guru
      if (formData.expense_category === 'Gaji Guru' && formData.teacher_id) {
        expenseData.teacher_id = formData.teacher_id;
      }

      const { error } = await supabase.from('expenses').insert([expenseData]);

      if (error) throw error;

      alert('Pengeluaran berhasil dicatat!');
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Gagal menyimpan pengeluaran');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Gagal menghapus pengeluaran');
    }
  };

  const resetForm = () => {
    setFormData({
      expense_category: 'Program',
      amount: '',
      description: '',
      vendor_name: '',
      payment_method: 'Tunai',
      teacher_id: '',
      expense_date: new Date().toISOString().split('T')[0],
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

  const categories = ['Program', 'Operasional', 'Administrasi', 'Pemeliharaan', 'ATK', 'Transportasi', 'Gaji Guru'];

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currentMonthExpenses = expenses
    .filter((e) => {
      const expenseMonth = new Date(e.expense_date).getMonth();
      const currentMonth = new Date().getMonth();
      return expenseMonth === currentMonth;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Pengeluaran Pesantren</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Batal' : 'Catat Pengeluaran'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="text-red-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Pengeluaran (Semua)</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="text-orange-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pengeluaran Bulan Ini</h3>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(currentMonthExpenses)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-red-50 rounded-lg p-6 mb-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Catat Pengeluaran</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={formData.expense_category}
                onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
                placeholder="1.000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Toko</label>
              <input
                type="text"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengeluaran</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {formData.expense_category === 'Gaji Guru' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Pilih Guru *
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.nip} - {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={2}
                required
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Deskripsi</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Vendor/Guru</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Metode</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{expense.expense_date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {expense.expense_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{expense.description}</td>
                  <td className="px-4 py-3 text-sm">
                    {expense.expense_category === 'Gaji Guru' && (expense as any).teacher
                      ? `${(expense as any).teacher.nip} - ${(expense as any).teacher.full_name}`
                      : expense.vendor_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{expense.payment_method}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">
                    {formatCurrency(Number(expense.amount))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <div className="text-center py-8 text-gray-500">Belum ada data pengeluaran</div>
          )}
        </div>
      )}
    </div>
  );
}
