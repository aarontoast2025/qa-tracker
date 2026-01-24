export function getStatusColor(status: string) {
  const s = status?.toLowerCase() || "";

  if (s === "active") {
    return "bg-green-50 hover:bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/20 dark:text-green-400 dark:border-green-800";
  }

  if (["termed", "terminated", "resigned", "pending term"].includes(s)) {
    return "bg-red-50 hover:bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-800";
  }

  if (["loa", "medical leave", "leave"].includes(s)) {
    return "bg-yellow-50 hover:bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
  }

  if (["sdr", "training", "upskilling"].includes(s)) {
    return "bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
  }

  // Default / Unknown
  return "bg-gray-50 hover:bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
}
