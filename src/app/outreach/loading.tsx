export default function Loading() {
  return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-44" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-40" />
      </div>
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}
