import type { ReactNode } from 'react';

interface QueryResultProps {
  enabled: boolean;
  idleMessage: string;
  isFetching: boolean;
  isPending: boolean;
  error?: Error;
  loadingMessage: string;
  onRetry: () => void;
  children: ReactNode;
}

export function QueryResult({
  enabled,
  idleMessage,
  isFetching,
  isPending,
  error,
  loadingMessage,
  onRetry,
  children,
}: QueryResultProps) {
  return (
    <div
      className="query-result"
      aria-live="polite"
      aria-busy={enabled && isFetching}
    >
      {!enabled ? (
        <div className="empty-state">{idleMessage}</div>
      ) : isFetching || (isPending && !error) ? (
        <div className="empty-state" role="status">
          {loadingMessage}
        </div>
      ) : error ? (
        <div className="query-error" role="alert">
          <p>{error.message}</p>
          <button type="button" className="retry-btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
