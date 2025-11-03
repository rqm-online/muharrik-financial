import { useState, useEffect } from 'react';
import { supabase, Donation } from '../lib/supabase';
import { Plus, Heart, Trash2 } from 'lucide-react';
import { handleCurrencyInput, parseThousandSeparator } from '../lib/formatters';

export default function DonationManagement() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    donation_type: 'Infaq',
    donor_name: '',
    donor_contact: '',
    amount: '',
    purpose: '',
    allocated_to: '',
    is_anonymous: false,
    donation_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('donation_date', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const receiptNumber = `ZISWAF-${Date.now()}`;
      const { error } = await supabase.from('donations').insert([
        {
          donation_type: formData.donation_type,
          donor_name: formData.is_anonymous ? 'Anonim' : formData.donor_name,
          donor_contact: formData.is_anonymous ? '' : formData.donor_contact,
          amount: parseThousandSeparator(formData.amount),
          purpose: formData.purpose,
          allocated_to: formData.allocated_to,
          is_anonymous: formData.is_anonymous,
          receipt_number: receiptNumber,
          donation_date: formData.donation_date,
        },
      ]);

      if (error) throw error;

      alert(`Donasi berhasil dicatat! No. Kwitansi: ${receiptNumber}`);
      resetForm();
      fetchDonations();
    } catch (error) {
      console.error('Error saving donation:', error);
      alert('Gagal menyimpan donasi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus donasi ini?')) return;

    try {
      const { error } = await supabase.from('donations').delete().eq('id', id);
      if (error) throw error;
      fetchDonations();
    } catch (error) {
      console.error('Error deleting donation:', error);
      alert('Gagal menghapus donasi');
    }
  };

  const resetForm = () => {
    setFormData({
      donation_type: 'Infaq',
      donor_name: '',
      donor_contact: '',
      amount: '',
      purpose: '',
      allocated_to: '',
      is_anonymous: false,
      donation_date: new Date().toISOString().split('T')[0],
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

  const donationTypes = ['Zakat', 'Infaq', 'Sedekah', 'Waqf'];

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const currentMonthDonations = donations
    .filter((d) => {
      const donationMonth = new Date(d.donation_date).getMonth();
      const currentMonth = new Date().getMonth();
      return donationMonth === currentMonth;
    })
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const donationsByType = donationTypes.map((type) => ({
    type,
    total: donations
      .filter((d) => d.donation_type === type)
      .reduce((sum, d) => sum + Number(d.amount), 0),
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Donasi ZISWAF</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Batal' : 'Catat Donasi'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
          <div className="flex items-center justify-between mb-2">
            <Heart className="text-pink-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total ZISWAF</h3>
          <p className="text-2xl font-bold text-pink-600">{formatCurrency(totalDonations)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Heart className="text-purple-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Bulan Ini</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentMonthDonations)}</p>
        </div>
        {donationsByType.slice(0, 2).map((item) => (
          <div key={item.type} className="bg-teal-50 rounded-lg p-6 border border-teal-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{item.type}</h3>
            <p className="text-2xl font-bold text-teal-600">{formatCurrency(item.total)}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-pink-50 rounded-lg p-6 mb-6 border border-pink-200">
          <h3 className="text-lg font-semibold text-pink-800 mb-4">Catat Donasi ZISWAF</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Donasi</label>
              <select
                value={formData.donation_type}
                onChange={(e) => setFormData({ ...formData, donation_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                required
              >
                {donationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                required
                placeholder="1.000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Donatur</label>
              <input
                type="text"
                value={formData.donor_name}
                onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                disabled={formData.is_anonymous}
                placeholder={formData.is_anonymous ? 'Anonim' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Donatur</label>
              <input
                type="text"
                value={formData.donor_contact}
                onChange={(e) => setFormData({ ...formData, donor_contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                disabled={formData.is_anonymous}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="Beasiswa, Operasional, dll"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dialokasikan Untuk</label>
              <input
                type="text"
                value={formData.allocated_to}
                onChange={(e) => setFormData({ ...formData, allocated_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Donasi</label>
              <input
                type="date"
                value={formData.donation_date}
                onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm font-medium text-gray-700">Donasi Anonim</span>
              </label>
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
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Donations Table */}
      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-pink-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">No. Kwitansi</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Jenis</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Donatur</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Tujuan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{donation.donation_date}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{donation.receipt_number}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                      {donation.donation_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {donation.donor_name || 'Anonim'}
                    {donation.is_anonymous && (
                      <span className="ml-2 text-xs text-gray-500">(Anonim)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-pink-600">
                    {formatCurrency(Number(donation.amount))}
                  </td>
                  <td className="px-4 py-3 text-sm">{donation.purpose || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(donation.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {donations.length === 0 && (
            <div className="text-center py-8 text-gray-500">Belum ada data donasi</div>
          )}
        </div>
      )}
    </div>
  );
}
