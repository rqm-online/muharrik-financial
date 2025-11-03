import { useState, useEffect } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import TableSkeleton from './ui/TableSkeleton';
import Pagination from './ui/Pagination';
import SortableHeader from './ui/SortableHeader';
import { sortData, paginateData, getTotalPages, SortConfig } from '../lib/tableUtils';

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'full_name', direction: 'asc' });
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nim: '',
    full_name: '',
    gender: 'Laki-laki',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
    parent_address: '',
    room_assignment: '',
    class: '',
    status: 'active',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', editingStudent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert([formData]);
        if (error) throw error;

        // Create savings account for new student
        const { data: newStudent } = await supabase
          .from('students')
          .select('id')
          .eq('nim', formData.nim)
          .single();

        if (newStudent) {
          await supabase.from('savings_accounts').insert([
            {
              student_id: newStudent.id,
              account_type: 'tabungan',
              current_balance: 0,
            },
          ]);
        }
      }

      resetForm();
      fetchStudents();
      alert(editingStudent ? 'Data santri berhasil diupdate!' : 'Santri baru berhasil ditambahkan!');
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Gagal menyimpan data santri');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nim: student.nim,
      full_name: student.full_name,
      gender: student.gender || 'Laki-laki',
      date_of_birth: student.date_of_birth || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_address: student.parent_address || '',
      room_assignment: student.room_assignment || '',
      class: student.class || '',
      status: student.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus santri ini?')) return;

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      fetchStudents();
      alert('Santri berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Gagal menghapus santri');
    }
  };

  const resetForm = () => {
    setFormData({
      nim: '',
      full_name: '',
      gender: 'Laki-laki',
      date_of_birth: '',
      parent_name: '',
      parent_phone: '',
      parent_address: '',
      room_assignment: '',
      class: '',
      status: 'active',
    });
    setEditingStudent(null);
    setShowForm(false);
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Filter and search
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesGender = genderFilter === 'all' || student.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  });

  // Sort and paginate
  const sortedStudents = sortData(filteredStudents, sortConfig);
  const totalPages = getTotalPages(sortedStudents.length, itemsPerPage);
  const paginatedStudents = paginateData(sortedStudents, currentPage, itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, genderFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Manajemen Santri</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showForm ? <Trash2 size={18} /> : <Plus size={18} />}
          {showForm ? 'Batal' : 'Tambah Santri'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-emerald-50 rounded-lg p-6 mb-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">
            {editingStudent ? 'Edit Santri' : 'Tambah Santri Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
              <input
                type="text"
                value={formData.nim}
                onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                disabled={!!editingStudent}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wali</label>
              <input
                type="text"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon Wali</label>
              <input
                type="tel"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kamar</label>
              <input
                type="text"
                value={formData.room_assignment}
                onChange={(e) => setFormData({ ...formData, room_assignment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Wali</label>
              <textarea
                value={formData.parent_address}
                onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows={2}
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
                {editingStudent ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari santri berdasarkan nama, NIM, atau kelas..."
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

      {/* Students Table */}
      {loading ? (
        <TableSkeleton rows={10} columns={7} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-t-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-emerald-50">
                <tr>
                  <SortableHeader
                    label="NIM"
                    columnKey="nim"
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
                    label="Kelas"
                    columnKey="class"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Kamar"
                    columnKey="room_assignment"
                    currentSortKey={sortConfig.key}
                    currentSortDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Wali"
                    columnKey="parent_name"
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
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{student.nim}</td>
                    <td className="px-4 py-3 text-sm font-medium">{student.full_name}</td>
                    <td className="px-4 py-3 text-sm">{student.class || '-'}</td>
                    <td className="px-4 py-3 text-sm">{student.room_assignment || '-'}</td>
                    <td className="px-4 py-3 text-sm">{student.parent_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {student.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white border-t">Tidak ada data santri</div>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={sortedStudents.length}
            />
          )}
        </>
      )}
    </div>
  );
}
