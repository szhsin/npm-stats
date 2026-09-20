import { hasPartialMonth } from '../api/npmDownloads';
import { useDownloadRoute } from '../hooks/useDownloadRoute';
import { usePackageDownloads } from '../hooks/usePackageDownloads';
import { DownloadForm } from '../components/DownloadForm';
import { QueryResult } from '../components/QueryResult';
import { DownloadPeriod } from '../components/DownloadPeriod';
import { TrendingIcon } from '../icons';
import { formatNumber, formatCompactNumber } from '../utils/formatNumbers';

export function PackageDownloadsPage({ search }: { search: string }) {
  const route = useDownloadRoute('package', search);
  const {
    data: packageResult,
    isPending,
    isFetching,
    error: packageError,
    refetch,
  } = usePackageDownloads(
    {
      packageName: route.request.name,
      startMonth: route.request.startMonth,
      endMonth: route.request.endMonth,
    },
    route.enabled,
  );

  return (
    <section className="card" id="package-section">
      <DownloadForm
        tab="package"
        route={route}
        isFetching={isFetching}
        onSubmit={(event) => route.submit(event, isFetching, refetch)}
      />

      <QueryResult
        enabled={route.enabled}
        idleMessage={
          route.months.error
            ? 'Choose a valid month range to view downloads.'
            : 'Enter an npm package name to view downloads.'
        }
        isFetching={isFetching}
        isPending={isPending}
        error={packageError}
        loadingMessage={`Loading downloads for ${route.request.name}…`}
        onRetry={() => void refetch()}
      >
        {packageResult && (
          <div className="stat-box">
            <div className="stat-heading">
              <div className="stat-label">
                Total Downloads ({packageResult.packageName})
              </div>
              <a
                className="package-npm-link"
                href={`https://www.npmjs.com/package/${packageResult.packageName}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View on npm: ${packageResult.packageName} (opens in a new tab)`}
              >
                View on npm <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="stat-value-huge">
              {formatNumber(packageResult.totalDownloads)}
            </div>
            <DownloadPeriod
              range={packageResult}
              partial={hasPartialMonth(packageResult)}
            />
            <div className="stat-subtext">
              <TrendingIcon width={14} height={14} />
              <span>
                Approx. {formatCompactNumber(packageResult.totalDownloads)} npm
                downloads in this range
              </span>
            </div>
          </div>
        )}
      </QueryResult>
    </section>
  );
}
