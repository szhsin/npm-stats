import type { ReactNode } from 'react';
import type { DownloadTab } from '../routing/downloadRoutes';
import { ResultSkeleton } from './ResultSkeleton';

interface QueryResultProps {
  enabled: boolean;
  idleMessage: string;
  isFetching: boolean;
  isPending: boolean;
  error?: Error;
  loadingMessage: string;
  tab: DownloadTab;
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
  tab,
  onRetry,
  children,
}: QueryResultProps) {
  return (
    <div className="query-result" aria-live="polite">
      {!enabled ? (
        <div className="empty-state">{idleMessage}</div>
      ) : isFetching || (isPending && !error) ? (
        <ResultSkeleton tab={tab} message={loadingMessage} />
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
