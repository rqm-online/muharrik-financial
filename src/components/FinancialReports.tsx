import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function FinancialReports() {
  const [reportData, setReportData] = useState({
    totalSPP: 0,
    totalDonations: 0,
    totalExpenses: 0,
    totalSavings: 0,
    activeStudents: 0,
    sppTransactions: [] as any[],
    donations: [] as any[],
    expenses: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    try {
      const monthStr = selectedMonth.toString().padStart(2, '0');
      const dateFilter = `${selectedYear}-${monthStr}-01`;

      const [studentsRes, sppRes, donationsRes, expensesRes, savingsRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase
          .from('transactions')
          .select('*')
          .eq('transaction_type', 'spp')
          .gte('transaction_date', dateFilter)
          .lt('transaction_date', `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-01`),
        supabase
          .from('donations')
          .select('*')
          .gte('donation_date', dateFilter)
          .lt('donation_date', `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-01`),
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', dateFilter)
          .lt('expense_date', `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-01`),
        supabase.from('savings_accounts').select('current_balance'),
      ]);

      setReportData({
        totalSPP: sppRes.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        totalDonations: donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
        totalExpenses: expensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        totalSavings: savingsRes.data?.reduce((sum, s) => sum + Number(s.current_balance), 0) || 0,
        activeStudents: studentsRes.count || 0,
        sppTransactions: sppRes.data || [],
        donations: donationsRes.data || [],
        expenses: expensesRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
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

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Pondok Pesantren Muharrik', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Laporan Keuangan', 105, 28, { align: 'center' });
    doc.setFontSize(12);
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    doc.text(`Periode: ${monthNames[selectedMonth - 1]} ${selectedYear}`, 105, 36, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.text('Ringkasan Keuangan', 14, 50);
    doc.setFontSize(10);
    doc.text(`Total Pemasukan SPP: ${formatCurrency(reportData.totalSPP)}`, 14, 58);
    doc.text(`Total Donasi ZISWAF: ${formatCurrency(reportData.totalDonations)}`, 14, 65);
    doc.text(`Total Pengeluaran: ${formatCurrency(reportData.totalExpenses)}`, 14, 72);
    doc.text(
      `Saldo Bersih: ${formatCurrency(reportData.totalSPP + reportData.totalDonations - reportData.totalExpenses)}`,
      14,
      79
    );
    doc.text(`Total Tabungan Santri: ${formatCurrency(reportData.totalSavings)}`, 14, 86);
    doc.text(`Jumlah Santri Aktif: ${reportData.activeStudents}`, 14, 93);

    // SPP Transactions Table
    if (reportData.sppTransactions.length > 0) {
      autoTable(doc, {
        startY: 105,
        head: [['Tanggal', 'No. Kwitansi', 'Jumlah', 'Metode']],
        body: reportData.sppTransactions.map((t) => [
          t.transaction_date,
          t.receipt_number || '-',
          formatCurrency(Number(t.amount)),
          t.payment_method || '-',
        ]),
        headStyles: { fillColor: [16, 185, 129] },
      });
    }

    // Donations Table
    if (reportData.donations.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 105;
      autoTable(doc, {
        startY: finalY + 10,
        head: [['Tanggal', 'Jenis', 'Donatur', 'Jumlah']],
        body: reportData.donations.map((d) => [
          d.donation_date,
          d.donation_type,
          d.donor_name || 'Anonim',
          formatCurrency(Number(d.amount)),
        ]),
        headStyles: { fillColor: [219, 39, 119] },
      });
    }

    // Expenses Table
    if (reportData.expenses.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 105;
      autoTable(doc, {
        startY: finalY + 10,
        head: [['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah']],
        body: reportData.expenses.map((e) => [
          e.expense_date,
          e.expense_category,
          e.description,
          formatCurrency(Number(e.amount)),
        ]),
        headStyles: { fillColor: [220, 38, 38] },
      });
    }

    doc.save(`Laporan-Keuangan-${monthNames[selectedMonth - 1]}-${selectedYear}.pdf`);
  };

  const exportToExcel = () => {
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    // Summary data
    const summaryData = [
      ['Laporan Keuangan Pondok Pesantren Muharrik'],
      [`Periode: ${monthNames[selectedMonth - 1]} ${selectedYear}`],
      [],
      ['Ringkasan'],
      ['Total Pemasukan SPP', formatCurrency(reportData.totalSPP)],
      ['Total Donasi ZISWAF', formatCurrency(reportData.totalDonations)],
      ['Total Pengeluaran', formatCurrency(reportData.totalExpenses)],
      [
        'Saldo Bersih',
        formatCurrency(reportData.totalSPP + reportData.totalDonations - reportData.totalExpenses),
      ],
      ['Total Tabungan Santri', formatCurrency(reportData.totalSavings)],
      ['Jumlah Santri Aktif', reportData.activeStudents],
    ];

    // SPP Transactions
    const sppData = [
      [],
      ['Pembayaran SPP'],
      ['Tanggal', 'No. Kwitansi', 'Jumlah', 'Metode'],
      ...reportData.sppTransactions.map((t) => [
        t.transaction_date,
        t.receipt_number || '-',
        Number(t.amount),
        t.payment_method || '-',
      ]),
    ];

    // Donations
    const donationsData = [
      [],
      ['Donasi ZISWAF'],
      ['Tanggal', 'Jenis', 'Donatur', 'Jumlah'],
      ...reportData.donations.map((d) => [
        d.donation_date,
        d.donation_type,
        d.donor_name || 'Anonim',
        Number(d.amount),
      ]),
    ];

    // Expenses
    const expensesData = [
      [],
      ['Pengeluaran'],
      ['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah'],
      ...reportData.expenses.map((e) => [
        e.expense_date,
        e.expense_category,
        e.description,
        Number(e.amount),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet([...summaryData, ...sppData, ...donationsData, ...expensesData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `Laporan-Keuangan-${monthNames[selectedMonth - 1]}-${selectedYear}.xlsx`);
  };

  const netIncome = reportData.totalSPP + reportData.totalDonations - reportData.totalExpenses;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Laporan Keuangan</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download size={18} />
            Export PDF
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

      {/* Period Selector */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <Calendar className="text-emerald-600" size={24} />
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {[
                  'Januari',
                  'Februari',
                  'Maret',
                  'April',
                  'Mei',
                  'Juni',
                  'Juli',
                  'Agustus',
                  'September',
                  'Oktober',
                  'November',
                  'Desember',
                ].map((month, idx) => (
                  <option key={idx} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : (
        <>
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pemasukan SPP</h3>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.totalSPP)}</p>
              <p className="text-xs text-gray-500 mt-1">{reportData.sppTransactions.length} transaksi</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Donasi ZISWAF</h3>
              <p className="text-2xl font-bold text-pink-600">{formatCurrency(reportData.totalDonations)}</p>
              <p className="text-xs text-gray-500 mt-1">{reportData.donations.length} donasi</p>
            </div>
            <div className="bg-red-50 rounded-lg p-6 border border-red-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pengeluaran</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">{reportData.expenses.length} transaksi</p>
            </div>
          </div>

          {/* Net Income */}
          <div
            className={`rounded-lg p-6 mb-6 ${
              netIncome >= 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                : 'bg-gradient-to-r from-red-500 to-orange-600'
            } text-white`}
          >
            <h3 className="text-lg font-semibold mb-2">Saldo Bersih Periode Ini</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-90">Total Pemasukan</p>
                <p className="text-xl font-bold">
                  {formatCurrency(reportData.totalSPP + reportData.totalDonations)}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90">Total Pengeluaran</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Saldo Bersih</p>
                <p className="text-xl font-bold">{formatCurrency(netIncome)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Total Tabungan</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.totalSavings)}</p>
              </div>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="space-y-6">
            {/* SPP Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-emerald-800 mb-3">Pembayaran SPP</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">
                        No. Kwitansi
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Jumlah</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.sppTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{t.transaction_date}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{t.receipt_number || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                          {formatCurrency(Number(t.amount))}
                        </td>
                        <td className="px-4 py-3 text-sm">{t.payment_method || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.sppTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Tidak ada transaksi SPP</div>
                )}
              </div>
            </div>

            {/* Donations */}
            <div>
              <h3 className="text-lg font-semibold text-pink-800 mb-3">Donasi ZISWAF</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-pink-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Jenis</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Donatur</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-pink-800">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.donations.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{d.donation_date}</td>
                        <td className="px-4 py-3 text-sm">{d.donation_type}</td>
                        <td className="px-4 py-3 text-sm">{d.donor_name || 'Anonim'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-pink-600">
                          {formatCurrency(Number(d.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.donations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Tidak ada donasi</div>
                )}
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-3">Pengeluaran</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Kategori</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Deskripsi</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-red-800">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{e.expense_date}</td>
                        <td className="px-4 py-3 text-sm">{e.expense_category}</td>
                        <td className="px-4 py-3 text-sm">{e.description}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">
                          {formatCurrency(Number(e.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.expenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Tidak ada pengeluaran</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
