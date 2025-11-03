import { useState, useEffect } from 'react';
import { supabase, Student, SavingsAccount, Transaction } from '../lib/supabase';
import { Plus, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { handleCurrencyInput, parseThousandSeparator } from '../lib/formatters';

export default function StudentSavings() {
  const [students, setStudents] = useState<Student[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, savingsRes, transactionsRes] = await Promise.all([
        supabase.from('students').select('*').eq('status', 'active').order('full_name'),
        supabase.from('savings_accounts').select('*'),
        supabase
          .from('transactions')
          .select('*')
          .in('transaction_type', ['savings_deposit', 'savings_withdrawal'])
          .order('transaction_date', { ascending: false })
          .limit(50),
      ]);

      setStudents(studentsRes.data || []);
      setSavingsAccounts(savingsRes.data || []);
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
      const savingsAccount = savingsAccounts.find((s) => s.student_id === formData.student_id);
      if (!savingsAccount) {
        alert('Rekening tabungan tidak ditemukan');
        return;
      }

      const amount = parseThousandSeparator(formData.amount);
      const newBalance =
        transactionType === 'deposit'
          ? Number(savingsAccount.current_balance) + amount
          : Number(savingsAccount.current_balance) - amount;

      if (transactionType === 'withdrawal' && newBalance < 0) {
        alert('Saldo tidak mencukupi');
        return;
      }

      // Insert transaction
      await supabase.from('transactions').insert([
        {
          transaction_type: transactionType === 'deposit' ? 'savings_deposit' : 'savings_withdrawal',
          student_id: formData.student_id,
          savings_account_id: savingsAccount.id,
          amount: amount,
          description: formData.description,
          transaction_date: formData.transaction_date,
        },
      ]);

      // Update savings account balance
      await supabase
        .from('savings_accounts')
        .update({ current_balance: newBalance })
        .eq('id', savingsAccount.id);

      alert(`${transactionType === 'deposit' ? 'Setoran' : 'Penarikan'} tabungan berhasil!`);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Gagal menyimpan transaksi');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '',
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

  const getStudentInfo = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const savings = savingsAccounts.find((s) => s.student_id === studentId);
    return {
      name: student ? student.full_name : 'Unknown',
      nim: student ? student.nim : '-',
      balance: savings ? Number(savings.current_balance) : 0,
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Tabungan Santri</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Batal' : 'Transaksi Tabungan'}
        </button>
      </div>

      {/* Total Savings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <PiggyBank className="text-purple-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Tabungan</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(savingsAccounts.reduce((sum, s) => sum + Number(s.current_balance), 0))}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Setoran (Bulan Ini)</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(
              transactions
                .filter(
                  (t) =>
                    t.transaction_type === 'savings_deposit' &&
                    new Date(t.transaction_date).getMonth() === new Date().getMonth()
                )
                .reduce((sum, t) => sum + Number(t.amount), 0)
            )}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-orange-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Penarikan (Bulan Ini)</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(
              transactions
                .filter(
                  (t) =>
                    t.transaction_type === 'savings_withdrawal' &&
                    new Date(t.transaction_date).getMonth() === new Date().getMonth()
                )
                .reduce((sum, t) => sum + Number(t.amount), 0)
            )}
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-purple-50 rounded-lg p-6 mb-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Transaksi Tabungan</h3>

          {/* Transaction Type Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTransactionType('deposit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                transactionType === 'deposit'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Setor Tabungan
            </button>
            <button
              onClick={() => setTransactionType('withdrawal')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                transactionType === 'withdrawal'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tarik Tabungan
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Santri</label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Pilih Santri</option>
                {students.map((student) => {
                  const info = getStudentInfo(student.id);
                  return (
                    <option key={student.id} value={student.id}>
                      {student.full_name} - Saldo: {formatCurrency(info.balance)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => handleCurrencyInput(e.target.value, (value) => setFormData({ ...formData, amount: value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                placeholder="1.000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  transactionType === 'deposit'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {transactionType === 'deposit' ? 'Setor' : 'Tarik'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Savings Accounts List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-4">Daftar Saldo Tabungan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const info = getStudentInfo(student.id);
            return (
              <div key={student.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{student.full_name}</h4>
                    <p className="text-sm text-gray-600">{student.nim}</p>
                  </div>
                  <PiggyBank className="text-purple-500" size={24} />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">Saldo Tabungan</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(info.balance)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions History */}
      <h3 className="text-lg font-semibold text-purple-800 mb-4">Riwayat Transaksi</h3>
      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Santri</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Tipe</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-800">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const info = transaction.student_id ? getStudentInfo(transaction.student_id) : null;
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{transaction.transaction_date}</td>
                    <td className="px-4 py-3 text-sm">
                      {info ? `${info.name} (${info.nim})` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.transaction_type === 'savings_deposit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {transaction.transaction_type === 'savings_deposit' ? 'Setoran' : 'Penarikan'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      <span
                        className={
                          transaction.transaction_type === 'savings_deposit'
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }
                      >
                        {transaction.transaction_type === 'savings_deposit' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{transaction.description || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">Belum ada transaksi tabungan</div>
          )}
        </div>
      )}
    </div>
  );
}
