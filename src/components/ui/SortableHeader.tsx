import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { SortDirection } from '../../lib/tableUtils';

interface SortableHeaderProps {
  label: string;
  columnKey: string;
  currentSortKey: string;
  currentSortDirection: SortDirection;
  onSort: (key: string) => void;
}

export default function SortableHeader({
  label,
  columnKey,
  currentSortKey,
  currentSortDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSortKey === columnKey;

  return (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors select-none"
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {isActive ? (
          currentSortDirection === 'asc' ? (
            <ArrowUp size={16} className="text-emerald-600" />
          ) : (
            <ArrowDown size={16} className="text-emerald-600" />
          )
        ) : (
          <ArrowUpDown size={16} className="text-gray-400" />
        )}
      </div>
    </th>
  );
}
