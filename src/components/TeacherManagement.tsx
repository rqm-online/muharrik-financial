import { useState, useEffect } from 'react';
import { supabase, Teacher } from '../lib/supabase';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import TableSkeleton from './ui/TableSkeleton';
import Pagination from './ui/Pagination';
import SortableHeader from './ui/SortableHeader';
import { sortData, paginateData, getTotalPages, SortConfig } from '../lib/tableUtils';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'full_name', direction: 'asc' });
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    nip: '',
    full_name: '',
    gender: 'Laki-laki',
    date_of_birth: '',
    phone: '',
    address: '',
    qualification: '',
    specialization: '',
    base_salary: '',
    hourly_rate: '',
    status: 'active',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Clean up formData - convert empty strings to null for nullable fields
      const cleanData = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone || null,
        address: formData.address || null,
        qualification: formData.qualification || null,
        specialization: formData.specialization || null,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };

      if (editingTeacher) {
        const { error } = await supabase
          .from('teachers')
          .update(cleanData)
          .eq('id', editingTeacher.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teachers').insert([cleanData]);
        if (error) throw error;
      }

      resetForm();
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Gagal menyimpan data guru');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      nip: teacher.nip,
      full_name: teacher.full_name,
      gender: teacher.gender || 'Laki-laki',
      date_of_birth: teacher.date_of_birth || '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      base_salary: teacher.base_salary.toString(),
      hourly_rate: teacher.hourly_rate?.toString() || '',
      status: teacher.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return;

    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Gagal menghapus guru');
    }
  };

  const resetForm = () => {
    setFormData({
      nip: '',
      full_name: '',
      gender: 'Laki-laki',
      date_of_birth: '',
      phone: '',
      address: '',
      qualification: '',
      specialization: '',
      base_salary: '',
      hourly_rate: '',
      status: 'active',
    });
    setEditingTeacher(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    const matchesGender = genderFilter === 'all' || teacher.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  });

  const sortedTeachers = sortData(filteredTeachers, sortConfig);
  const totalPages = getTotalPages(sortedTeachers.length, itemsPerPage);
  const paginatedTeachers = paginateData(sortedTeachers, currentPage, itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, genderFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Manajemen Guru</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showForm ? <Trash2 size={18} /> : <Plus size={18} />}
          {showForm ? 'Batal' : 'Tambah Guru'}
        </button>
      </div>

      {showForm && (
        <div className="bg-emerald-50 rounded-lg p-6 mb-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">
            {editingTeacher ? 'Edit Guru' : 'Tambah Guru Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kualifikasi</label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="S1, S2, dll"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Matematika, Bahasa Arab, dll"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok (Rp)</label>
              <input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                min="0"
                step="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
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
                {editingTeacher ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIP, spesialisasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="all">Semua Jenis Kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-t-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-emerald-50">
                <tr>
                  <SortableHeader
                    label="NIP"
                    columnKey="nip"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Nama"
                    columnKey="full_name"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Spesialisasi"
                    columnKey="specialization"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Gaji Pokok"
                    columnKey="base_salary"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Status"
                    columnKey="status"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{teacher.nip}</td>
                  <td className="px-4 py-3 text-sm font-medium">{teacher.full_name}</td>
                  <td className="px-4 py-3 text-sm">{teacher.specialization || '-'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                    {formatCurrency(Number(teacher.base_salary))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        teacher.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {teacher.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            {paginatedTeachers.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white border-t">Tidak ada data guru</div>
            )}
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={sortedTeachers.length}
            />
          )}
        </>
      )}
    </div>
  );
}
