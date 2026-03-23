export default function Loading() {
  return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-48" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
