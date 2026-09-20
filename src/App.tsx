import { useState, useEffect } from 'react';
import { Link, Route, Switch, useRoute, useSearch } from 'wouter';
import './App.css';
import { SunIcon, MoonIcon, PackageIcon, UserIcon, GitHubIcon } from './icons';
import { PackageDownloadsPage } from './pages/PackageDownloadsPage';
import { AuthorDownloadsPage } from './pages/AuthorDownloadsPage';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isPackagePage] = useRoute('/');
  const [isAuthorPage] = useRoute('/author');
  const search = useSearch();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-section">
          <div className="npm-logo-badge">npm</div>
          <div>
            <h1 className="brand-title">stats</h1>
            <p className="brand-subtitle">Download Stats</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Toggle Light / Dark Theme"
          >
            {theme === 'dark' ? (
              <>
                <SunIcon width={16} height={16} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon width={16} height={16} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Download statistics">
        <Link
          href="/"
          className={`tab-btn ${isPackagePage ? 'active' : ''}`}
          aria-current={isPackagePage ? 'page' : undefined}
        >
          <PackageIcon width={16} height={16} />
          Package
        </Link>
        <Link
          href="/author"
          className={`tab-btn ${isAuthorPage ? 'active' : ''}`}
          aria-current={isAuthorPage ? 'page' : undefined}
        >
          <UserIcon width={16} height={16} />
          Author
        </Link>
      </nav>

      <main className="single-column">
        <Switch>
          <Route path="/">
            <PackageDownloadsPage key={search} search={search} />
          </Route>
          <Route path="/author">
            <AuthorDownloadsPage key={search} search={search} />
          </Route>
          <Route>
            <section className="card">
              <h2 className="card-title">Page not found</h2>
              <Link href="/">Go to package downloads</Link>
            </section>
          </Route>
        </Switch>
      </main>

      <footer className="footer">
        <p>npm-stats &bull; All data comes directly from npm.</p>
        <a
          className="footer-github"
          href="https://github.com/szhsin/npm-stats"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub: szhsin/npm-stats (opens in a new tab)"
        >
          <GitHubIcon
            width={18}
            height={18}
            aria-hidden="true"
            focusable="false"
          />
          <span>View on GitHub</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </a>
      </footer>
    </div>
  );
}

export default App;
