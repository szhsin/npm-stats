import type { DownloadTab } from '../routing/downloadRoutes';

interface ResultSkeletonProps {
  tab: DownloadTab;
  message: string;
}

export function ResultSkeleton({ tab, message }: ResultSkeletonProps) {
  return (
    <div className="loading-result">
      <p className="loading-status" role="status">
        <span className="loading-indicator" aria-hidden="true" />
        <span className="loading-message">{message}</span>
      </p>

      <div className="result-skeleton" aria-hidden="true">
        {tab === 'package' ? (
          <div className="stat-box">
            <div className="skeleton-heading">
              <span className="skeleton-bar skeleton-label" />
              <span className="skeleton-bar skeleton-link" />
            </div>
            <span className="skeleton-bar skeleton-number" />
            <span className="skeleton-bar skeleton-period" />
            <span className="skeleton-bar skeleton-caption" />
          </div>
        ) : (
          <>
            <div className="author-total-banner">
              <div className="skeleton-stack">
                <span className="skeleton-bar skeleton-label" />
                <span className="skeleton-bar skeleton-number" />
                <span className="skeleton-bar skeleton-period" />
                <span className="skeleton-bar skeleton-caption" />
              </div>
              <span className="skeleton-bar skeleton-pill" />
            </div>
            <span className="skeleton-bar skeleton-list-title" />
            <div className="package-list">
              {[0, 1, 2].map((index) => (
                <div className="skeleton-package" key={index}>
                  <div className="skeleton-heading">
                    <span className="skeleton-bar skeleton-package-name" />
                    <span className="skeleton-bar skeleton-package-count" />
                  </div>
                  <span className="skeleton-bar skeleton-package-desc" />
                  <span className="skeleton-bar skeleton-package-progress" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
