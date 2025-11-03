import { CheckCircle, Mail } from 'lucide-react';

interface RegistrationSuccessProps {
  email: string;
  onReset: () => void;
}

export default function RegistrationSuccess({ email, onReset }: RegistrationSuccessProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">Registrasi Berhasil!</h1>
          <p className="text-emerald-600">Akun Anda telah berhasil dibuat</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Mail className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Email: {email}</span>
          </div>
          <p className="text-green-700 text-sm">
            Akun student telah dibuat dengan role "Santri" (Student). Anda dapat sekarang login dengan email dan password yang telah didaftarkan.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onReset}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Lanjut ke Login
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Simpan informasi login Anda untuk akses sistem keuangan pesantren
          </p>
        </div>
      </div>
    </div>
  );
}