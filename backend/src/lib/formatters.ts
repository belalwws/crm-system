/**
 * Shared formatters for status/stage mapping across controllers.
 * Centralizes mapStatus, mapStage, formatStage to avoid duplication.
 */

/**
 * Maps customer status enum to display format
 * e.g., 'ACTIVE' -> 'active', 'INACTIVE' -> 'inactive'
 */
export function mapStatus(status: string): string {
  return status.toLowerCase();
}

/**
 * Maps deal stage enum to display format
 * e.g., 'CLOSED_WON' -> 'closed-won', 'IN_PROGRESS' -> 'in-progress'
 */
export function mapStage(stage: string): string {
  return stage.toLowerCase().replaceAll('_', '-');
}

/**
 * Formats stage for display (capitalize first letter of each word)
 * e.g., 'CLOSED_WON' -> 'Closed Won'
 */
export function formatStage(stage: string): string {
  return stage
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Maps task priority enum to display format
 */
export function mapPriority(priority: string): string {
  return priority.toLowerCase();
}

/**
 * Maps task status enum to display format
 */
export function mapTaskStatus(status: string): string {
  return status.toLowerCase().replaceAll('_', '-');
}

/**
 * Consistent error message for production vs development
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === 'production') {
    return fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
