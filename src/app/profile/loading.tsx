export default function Loading() {
  return (
    <div className="p-6 animate-pulse space-y-6 max-w-2xl">
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-40" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
    </div>
  );
}
