export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-52" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded-full ml-3" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
