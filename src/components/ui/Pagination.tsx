import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg">
      <div className="flex items-center text-sm text-gray-700">
        Menampilkan <span className="font-medium mx-1">{startItem}</span> -
        <span className="font-medium mx-1">{endItem}</span> dari
        <span className="font-medium mx-1">{totalItems}</span> data
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Halaman pertama"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Halaman sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={i}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[36px] px-3 py-1 rounded-lg text-sm ${
                  currentPage === pageNum
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'hover:bg-emerald-50 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Halaman selanjutnya"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Halaman terakhir"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
