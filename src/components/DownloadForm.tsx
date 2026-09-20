import type { FormEvent, ReactNode } from 'react';
import type { useDownloadRoute } from '../hooks/useDownloadRoute';
import type { DownloadTab } from '../routing/downloadRoutes';
import { DownloadIcon, PackageIcon, SearchIcon, UserIcon } from '../icons';
import { MonthRangeSelector } from './MonthRangeSelector';

const fields = {
  package: {
    label: 'Package Name',
    placeholder: 'Enter package name (e.g. react, express, lodash)...',
    buttonLabel: 'Get Total Downloads',
    TitleIcon: PackageIcon,
    InputIcon: SearchIcon,
  },
  author: {
    label: 'Author Name',
    placeholder: 'Enter author username (e.g. sindresorhus, tj)...',
    buttonLabel: 'Get Downloads by Author',
    TitleIcon: UserIcon,
    InputIcon: UserIcon,
  },
};

interface DownloadFormProps {
  tab: DownloadTab;
  route: ReturnType<typeof useDownloadRoute>;
  isFetching: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
}

export function DownloadForm({
  tab,
  route,
  isFetching,
  onSubmit,
  children,
}: DownloadFormProps) {
  const { label, placeholder, buttonLabel, TitleIcon, InputIcon } = fields[tab];
  const labelId = `${tab}-name-label`;

  return (
    <>
      <h2 className="card-title" id={labelId}>
        <TitleIcon width={20} height={20} stroke="var(--action-color)" />
        {label}
      </h2>
      <form onSubmit={onSubmit} className="download-search-form">
        <div className="search-form">
          <div className="input-wrapper">
            <InputIcon className="input-icon" width={18} height={18} />
            <input
              type="text"
              className="search-input"
              aria-labelledby={labelId}
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder={placeholder}
              value={route.name}
              onChange={(event) => route.setName(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="search-btn"
            disabled={isFetching || !route.canSubmit}
          >
            <DownloadIcon width={18} height={18} />
            {isFetching ? 'Loading Downloads…' : buttonLabel}
          </button>
        </div>
        <MonthRangeSelector
          idPrefix={tab}
          range={route.months.range}
          onChange={route.months.setRange}
          error={route.months.error}
        />
        {children}
      </form>
    </>
  );
}
