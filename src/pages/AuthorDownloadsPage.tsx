import { Link } from 'wouter';
import { AUTHOR_PACKAGE_LIMIT } from '../api/npmAuthors';
import { hasPartialMonth } from '../api/npmDownloads';
import { useDownloadRoute } from '../hooks/useDownloadRoute';
import { useAuthorDownloads } from '../hooks/useAuthorDownloads';
import { DownloadForm } from '../components/DownloadForm';
import { QueryResult } from '../components/QueryResult';
import { DownloadPeriod } from '../components/DownloadPeriod';
import { DownloadIcon, ListIcon } from '../icons';
import { formatNumber } from '../utils/formatNumbers';
import { createDownloadUrl } from '../routing/downloadRoutes';

export function AuthorDownloadsPage({ search }: { search: string }) {
  const route = useDownloadRoute('author', search);
  const {
    data: authorResult,
    isPending: isAuthorPending,
    isFetching: isAuthorFetching,
    error: authorError,
    refetch: refetchAuthor,
  } = useAuthorDownloads(
    {
      authorName: route.request.name,
      startMonth: route.request.startMonth,
      endMonth: route.request.endMonth,
    },
    route.enabled,
  );
  const maxAuthorPkgDownloads = authorResult?.packages[0]?.totalDownloads || 1;

  return (
    <section className="card" id="author-section">
      <DownloadForm
        tab="author"
        route={route}
        isFetching={isAuthorFetching}
        onSubmit={(event) =>
          route.submit(event, isAuthorFetching, refetchAuthor)
        }
      >
        <p className="range-hint">
          Selects up to {AUTHOR_PACKAGE_LIMIT} packages by npm popularity, then
          ranks them by downloads in your range.
        </p>
      </DownloadForm>

      <QueryResult
        enabled={route.enabled}
        idleMessage={
          route.months.error
            ? 'Choose a valid month range to view downloads.'
            : 'Enter an npm author username to view their packages and downloads.'
        }
        isFetching={isAuthorFetching}
        isPending={isAuthorPending}
        error={authorError}
        loadingMessage={`Loading packages and downloads for @${route.request.name}…`}
        onRetry={() => void refetchAuthor()}
      >
        {authorResult &&
          (authorResult.packageCount === 0 ? (
            <div className="empty-state">
              No packages found for @{authorResult.authorName}. Try another
              author username.
            </div>
          ) : (
            <>
              {/* Total Combined Downloads Metric */}
              <div className="author-total-banner">
                <div className="total-combined-info">
                  <div className="total-combined-title">
                    Combined Downloads (@{authorResult.authorName})
                  </div>
                  <div className="total-combined-number">
                    {formatNumber(authorResult.totalCombinedDownloads)}
                  </div>
                  <DownloadPeriod
                    range={authorResult}
                    partial={authorResult.packages.some(hasPartialMonth)}
                  />
                  <p className="range-hint">
                    Total across {authorResult.packageCount}{' '}
                    {authorResult.packageCount === 1 ? 'package' : 'packages'}
                  </p>
                </div>
                <div className="author-meta-pills">
                  <span className="meta-pill">
                    {authorResult.packageCount} of{' '}
                    {authorResult.totalPackageCount}{' '}
                    {authorResult.totalPackageCount === 1
                      ? 'Package'
                      : 'Packages'}
                  </span>
                </div>
              </div>

              <div className="list-title">
                <ListIcon width={16} height={16} />
                Packages by {authorResult.authorName}
              </div>

              <div className="package-list">
                {authorResult.packages.map((pkg, idx) => {
                  const percentage =
                    pkg.totalDownloads === 0
                      ? 0
                      : Math.max(
                          5,
                          Math.round(
                            (pkg.totalDownloads / maxAuthorPkgDownloads) * 100,
                          ),
                        );
                  return (
                    <Link
                      key={pkg.packageName}
                      className="package-item"
                      href={createDownloadUrl(
                        'package',
                        pkg.packageName,
                        authorResult,
                      )}
                      title="Click package to view its download totals"
                    >
                      <span className="package-item-top">
                        <span className="package-item-main">
                          <span
                            className={`rank-badge ${idx < 3 ? `top-${idx + 1}` : ''}`}
                          >
                            #{idx + 1}
                          </span>
                          <span>
                            <span className="package-name-title">
                              {pkg.packageName}
                            </span>
                            {pkg.version && (
                              <span
                                className="package-version"
                                style={{ marginLeft: '8px' }}
                              >
                                v{pkg.version}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="package-downloads-count">
                          <DownloadIcon width={14} height={14} />
                          {formatNumber(pkg.totalDownloads)}
                        </span>
                      </span>

                      {pkg.description && (
                        <span className="package-desc">{pkg.description}</span>
                      )}

                      {/* Relative popularity visual bar */}
                      <span
                        className="progress-bar-bg"
                        title={`${percentage}% relative to top package`}
                      >
                        <span
                          className="progress-bar-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ))}
      </QueryResult>
    </section>
  );
}
