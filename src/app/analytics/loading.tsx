export default function Loading() {
  return (
    <div className="p-6 animate-pulse space-y-6">
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-40" />
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
