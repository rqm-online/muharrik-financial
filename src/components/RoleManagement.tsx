import { useState, useEffect } from 'react';
import { supabase, Profile, Student, Teacher } from '../lib/supabase';
import { UserCog, Shield, Users as UsersIcon, Trash2, Search, Filter } from 'lucide-react';
import TableSkeleton from './ui/TableSkeleton';
import Pagination from './ui/Pagination';
import SortableHeader from './ui/SortableHeader';
import { sortData, paginateData, getTotalPages, SortConfig } from '../lib/tableUtils';

export default function RoleManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [students, setStudents] = useState<{id: string; nim: string; full_name: string}[]>([]);
  const [teachers, setTeachers] = useState<{id: string; nip: string; full_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Table features
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'email', direction: 'asc' });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchData = async () => {
    try {
      const [profilesRes, studentsRes, teachersRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, nim, full_name').eq('status', 'active'),
        supabase.from('teachers').select('id, nip, full_name').eq('status', 'active'),
      ]);

      setProfiles(profilesRes.data || []);
      setStudents(studentsRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: string, studentId?: string, teacherId?: string) => {
    try {
      const updates: any = { role: newRole };
      
      if (newRole === 'santri') {
        updates.student_id = studentId || null;
        updates.teacher_id = null;
      } else if (newRole === 'guru') {
        updates.teacher_id = teacherId || null;
        updates.student_id = null;
      } else if (newRole === 'komite') {
        updates.student_id = null;
        updates.teacher_id = null;
      } else {
        updates.student_id = null;
        updates.teacher_id = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      alert('Role berhasil diupdate!');
      setEditingProfile(null);
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Gagal mengupdate role');
    }
  };

  const handleDelete = async (profile: Profile) => {
    // Check if trying to delete current user
    if (profile.id === currentUserId) {
      alert('Anda tidak dapat menghapus akun yang sedang digunakan!');
      return;
    }

    setDeletingProfile(profile);
  };

  const confirmDelete = async () => {
    if (!deletingProfile) return;

    try {
      // First delete the profile from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingProfile.id);

      if (profileError) throw profileError;

      // Then delete the auth user (requires service role key or admin privileges)
      // Note: This may not work with client-side deletion, admin should do this manually
      const { error: authError } = await supabase.auth.admin.deleteUser(deletingProfile.id);
      
      if (authError) {
        console.warn('Could not delete auth user (requires admin privileges):', authError);
        alert('Profil dihapus, tetapi akun auth mungkin perlu dihapus secara manual oleh admin sistem.');
      } else {
        alert('Pengguna berhasil dihapus!');
      }

      setDeletingProfile(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Gagal menghapus pengguna: ${error.message}`);
      setDeletingProfile(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      santri: 'bg-blue-100 text-blue-800',
      guru: 'bg-green-100 text-green-800',
      komite: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      admin: 'Administrator',
      santri: 'Santri',
      guru: 'Guru',
      komite: 'Komite',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Filter and search
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = 
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || profile.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort and paginate
  const sortedProfiles = sortData(filteredProfiles, sortConfig);
  const totalPages = getTotalPages(sortedProfiles.length, itemsPerPage);
  const paginatedProfiles = paginateData(sortedProfiles, currentPage, itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const roleStats = {
    admin: profiles.filter((p) => p.role === 'admin').length,
    santri: profiles.filter((p) => p.role === 'santri').length,
    guru: profiles.filter((p) => p.role === 'guru').length,
    komite: profiles.filter((p) => p.role === 'komite').length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">Manajemen Role & Pengguna</h2>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Shield className="text-purple-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Administrator</h3>
          <p className="text-3xl font-bold text-purple-600">{roleStats.admin}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <UsersIcon className="text-blue-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Santri</h3>
          <p className="text-3xl font-bold text-blue-600">{roleStats.santri}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <UserCog className="text-green-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Guru</h3>
          <p className="text-3xl font-bold text-green-600">{roleStats.guru}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Shield className="text-orange-600" size={32} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Komite</h3>
          <p className="text-3xl font-bold text-orange-600">{roleStats.komite}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan email atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Administrator</option>
            <option value="santri">Santri</option>
            <option value="guru">Guru</option>
            <option value="komite">Komite</option>
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

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-t-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-emerald-50">
                <tr>
                  <SortableHeader
                    label="Email"
                    columnKey="email"
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
                    label="Role"
                    columnKey="role"
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Linked To</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-800">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProfiles.map((profile) => {
                  const student = students.find((s) => s.id === profile.student_id);
                  const teacher = teachers.find((t) => t.id === profile.teacher_id);
                  const isCurrentUser = profile.id === currentUserId;

                  return (
                    <tr key={profile.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{profile.email}</td>
                      <td className="px-4 py-3 text-sm font-medium">{profile.full_name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{getRoleBadge(profile.role)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            profile.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {profile.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student ? `Santri: ${student.full_name}` : teacher ? `Guru: ${teacher.full_name}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProfile(profile)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(profile)}
                            disabled={isCurrentUser}
                            className={`font-medium ${
                              isCurrentUser
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                            title={isCurrentUser ? 'Tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {paginatedProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white border-t">Tidak ada pengguna yang sesuai</div>
            )}
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={sortedProfiles.length}
            />
          )}
        </>
      )}

      {/* Edit Role Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Role Pengguna</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <p className="text-gray-900">{editingProfile.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                value={editingProfile.role}
                onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value as any })}
              >
                <option value="admin">Administrator</option>
                <option value="santri">Santri</option>
                <option value="guru">Guru</option>
                <option value="komite">Komite</option>
              </select>
            </div>

            {editingProfile.role === 'santri' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link ke Santri</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  value={editingProfile.student_id || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, student_id: e.target.value || undefined })}
                >
                  <option value="">Pilih Santri</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.nim})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editingProfile.role === 'guru' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link ke Guru</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  value={editingProfile.teacher_id || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, teacher_id: e.target.value || undefined })}
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.nip})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingProfile(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleRoleChange(editingProfile.id, editingProfile.role, editingProfile.student_id, editingProfile.teacher_id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Konfirmasi Hapus Pengguna</h3>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Apakah Anda yakin ingin menghapus pengguna berikut?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-medium">{deletingProfile.email}</p>
                <p className="text-sm text-gray-600">{deletingProfile.full_name || 'Tidak ada nama'}</p>
                <p className="text-sm">{getRoleBadge(deletingProfile.role)}</p>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm text-red-700">
                <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. 
                Semua data terkait pengguna ini akan dihapus.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingProfile(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
