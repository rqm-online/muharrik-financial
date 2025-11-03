export default function MetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl p-6 shadow-lg animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gray-500 rounded"></div>
          </div>
          <div className="h-3 bg-gray-500 rounded w-24 mb-2"></div>
          <div className="h-6 bg-gray-600 rounded w-32"></div>
        </div>
      ))}
    </div>
  );
}
