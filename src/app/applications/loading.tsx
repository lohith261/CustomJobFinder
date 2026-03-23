export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-48" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-36" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col w-72 flex-shrink-0">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
            <div className="flex-1 min-h-[400px] rounded-b-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
