import React, { useContext, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../auth/auth.context";
import PerformanceChart from "../components/PerformanceChart";
import RecommendationBox from "../components/RecommendationBox";
import ScoreCard from "../components/ScoreCard";
import { useDashboard } from "../hooks/useDashboard";
import "../styles/dashboard.scss";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", active: true },
  { key: "activity", label: "Activity" },
  { key: "schedule", label: "Schedule" },
  { key: "settings", label: "Settings" },
];

const buildQuery = (reportId, sessionId) => {
  const params = new URLSearchParams();

  if (reportId) {
    params.set("reportId", reportId);
  }

  if (sessionId) {
    params.set("sessionId", sessionId);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

const BrandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12 8.5 7.5 12 11l3.5-3.5L20 12l-4.5 4.5L12 13l-3.5 3.5z" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </svg>
);

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M7 4h7l5 5v11H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v5h5" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 7h8M4 17h5M15 17h5M18 7h2" />
    <circle cx="14" cy="7" r="3" />
    <circle cx="9" cy="17" r="3" />
  </svg>
);

const ICON_MAP = {
  dashboard: DashboardIcon,
  activity: ActivityIcon,
  schedule: CalendarIcon,
  settings: SettingsIcon,
};

const formatMetricValue = (value) =>
  value === null || value === undefined ? "--" : `${Math.round(value)}%`;

const getInitials = (name) =>
  (name || "Candidate")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk.charAt(0).toUpperCase())
    .join("");

const getReportStamp = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `/${month}${date.getFullYear()}`;
};

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get("reportId") || location.state?.reportId || "";
  const sessionId = searchParams.get("sessionId") || location.state?.sessionId || "";
  const initialData = location.state?.reportSummary || null;

  const {
    report,
    metrics,
    quickStats,
    hasReport,
    loading,
    isSyncing,
    error,
    refreshReport,
  } = useDashboard({
    reportId,
    sessionId,
    initialData,
  });

  const reportLink = `/dashboard/report${buildQuery(reportId, sessionId)}`;
  const profileName = user?.username || user?.email?.split("@")[0] || "Candidate";
  const spotlightMetric = useMemo(() => {
    return metrics.reduce((bestMetric, metric) => {
      if (metric.value === null || metric.value === undefined) {
        return bestMetric;
      }

      if (!bestMetric || Number(metric.value) > Number(bestMetric.value || 0)) {
        return metric;
      }

      return bestMetric;
    }, null);
  }, [metrics]);

  const trustPanelValue =
    report.trustScore === null || report.trustScore === undefined
      ? report.score
      : report.trustScore;

  const scoreLegend = useMemo(
    () =>
      metrics
        .filter((metric) => metric.value !== null && metric.value !== undefined)
        .slice(0, 2)
        .map((metric, index) => ({
          label: metric.label,
          value: metric.value,
          tone: index === 0 ? "dark" : "soft",
        })),
    [metrics]
  );

  const chartItems = useMemo(
    () =>
      [
        ...metrics,
        {
          key: "overall",
          label: "Overall",
          value: report.score,
        },
      ]
        .filter((metric) => metric.value !== null && metric.value !== undefined)
        .map((metric) => ({
          ...metric,
          shortLabel:
            metric.key === "technical"
              ? "Tech"
              : metric.key === "confidence"
              ? "Conf"
              : metric.key === "overall"
              ? "Score"
              : "Clarity",
        })),
    [metrics, report.score]
  );

  const readinessValue = useMemo(() => {
    const values = [report.score, report.trustScore, metrics[0]?.value]
      .filter((value) => value !== null && value !== undefined)
      .map((value) => Number(value));

    if (!values.length) {
      return 0;
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [metrics, report.score, report.trustScore]);

  const metricDelta = useMemo(() => {
    if (!spotlightMetric || report.score === null || report.score === undefined) {
      return null;
    }

    return Math.round(Number(spotlightMetric.value) - Number(report.score));
  }, [report.score, spotlightMetric]);

  const feedbackSummary =
    report.recommendation ||
    report.strengths[0] ||
    "Your AI feedback summary will appear here once the evaluation is ready.";

  const focusLine =
    report.weaknesses[0] ||
    report.suggestions[0] ||
    "Open the full report to review coaching notes and next steps.";

  return (
    <div className="candidate-dashboard candidate-dashboard--studio">
      <div className="candidate-shell candidate-shell--studio">
        {error && !hasReport ? (
          <div className="dashboard-banner dashboard-banner--error">{error}</div>
        ) : null}

        {error && hasReport ? (
          <div className="dashboard-banner">
            Live sync is unavailable right now. Showing the latest saved report.
          </div>
        ) : null}

        {loading && !hasReport ? (
          <div className="dashboard-loading">Loading your interview dashboard...</div>
        ) : !hasReport ? (
          <div className="dashboard-empty">
            No completed interview report is available yet. Finish a mock session to populate
            this dashboard.
          </div>
        ) : (
          <section className="studio-frame">
            <header className="studio-topbar">
              <div className="studio-brand">
                <span className="studio-brand__mark">
                  <BrandIcon />
                </span>
                <strong>Wise</strong>
              </div>

              <h1 className="studio-title">Statistics</h1>

              <label className="studio-search">
                <span className="studio-search__icon">
                  <SearchIcon />
                </span>
                <input type="search" placeholder="Search something..." />
              </label>

              <button
                type="button"
                className="studio-upgrade-btn"
                onClick={() => void refreshReport()}
                disabled={isSyncing}
              >
                {isSyncing ? "Refreshing" : "Upgrade"}
              </button>

              <button type="button" className="studio-icon-btn" aria-label="Notifications">
                <BellIcon />
              </button>
            </header>

            <aside className="studio-sidebar">
              <div className="studio-profile">
                <div className="studio-profile__avatar" aria-hidden="true">
                  {getInitials(profileName)}
                </div>

                <strong>{profileName}</strong>
                <span>{user?.email || "Candidate account"}</span>

                <button type="button" className="studio-profile__edit">
                  Edit
                </button>
              </div>

              <nav className="studio-nav" aria-label="Dashboard navigation">
                {NAV_ITEMS.map((item) => {
                  const Icon = ICON_MAP[item.key];

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`studio-nav__item ${item.active ? "is-active" : ""}`}
                    >
                      <span className="studio-nav__icon">
                        <Icon />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="studio-theme-toggle" aria-hidden="true">
                <span>Dark</span>
                <div className="studio-theme-toggle__switch">
                  <span className="studio-theme-toggle__moon" />
                  <span className="studio-theme-toggle__thumb" />
                </div>
                <span>Dark</span>
              </div>
            </aside>

            <main className="studio-main">
              <div className="studio-grid">
                <div className="studio-grid__score">
                  <ScoreCard
                    variant="studio"
                    score={report.score}
                    title="Interview Score"
                    legendItems={scoreLegend}
                    trustScore={report.trustScore}
                  />
                </div>

                <article className="dashboard-card studio-report-card">
                  <div className="studio-report-card__top">
                    <span className="studio-pill">Full report</span>
                    <span className="studio-report-card__stamp">{getReportStamp(report.createdAt)}</span>
                  </div>

                  <div className="studio-report-card__body">
                    <h2>{report.title || "Interview Performance Report"}</h2>
                    <p>{focusLine}</p>
                  </div>

                  <div className="studio-report-card__actions">
                    <Link
                      className="studio-report-card__action"
                      to={reportLink}
                      state={{ reportSummary: report, reportId, sessionId }}
                    >
                      Open Full Report
                    </Link>

                    <Link
                      className="studio-report-card__icon"
                      to={reportLink}
                      state={{ reportSummary: report, reportId, sessionId }}
                      aria-label="Open report"
                    >
                      <ArrowUpRightIcon />
                    </Link>
                  </div>
                </article>

                <article className="dashboard-card studio-spotlight-card">
                  <div className="studio-spotlight-card__top">
                    <div>
                      <h2>Trust Rate</h2>
                    </div>

                    <Link
                      className="studio-spotlight-card__icon"
                      to={reportLink}
                      state={{ reportSummary: report, reportId, sessionId }}
                      aria-label="View detailed report"
                    >
                      <ArrowUpRightIcon />
                    </Link>
                  </div>

                  <div className="studio-spotlight-card__tabs">
                    {metrics.map((metric) => (
                      <div
                        key={metric.key}
                        className={`studio-spotlight-card__tab ${
                          metric.key === spotlightMetric?.key ? "is-active" : ""
                        }`}
                      >
                        <span>{metric.label.split(" ")[0]}</span>
                        <strong>{metric.value === null ? "--" : Math.round(metric.value)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="studio-spotlight-card__stats">
                    <strong>{formatMetricValue(trustPanelValue ?? null)}</strong>

                    <div>
                      <span>
                        {metricDelta === null
                          ? `${report.totalQuestions ?? "--"} Qs`
                          : `${metricDelta > 0 ? "+" : ""}${metricDelta}%`}
                      </span>
                      <p>
                        {metricDelta === null
                          ? "Since interview completed"
                          : "Compared with your overall score"}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="dashboard-card studio-readiness-card">
                  <div className="studio-readiness-card__header">
                    <div className="studio-readiness-card__title">
                      <span className="studio-readiness-card__chip" />
                      <h2>Readiness</h2>
                    </div>

                    <span>Details</span>
                  </div>

                  <strong>{readinessValue}%</strong>
                  <p>Return on interview preparation</p>

                  <svg
                    className="studio-readiness-card__wave"
                    viewBox="0 0 320 120"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 88 C30 36 62 36 92 88 S154 140 182 88 S244 36 274 88 S304 140 320 72"
                      pathLength="100"
                    />
                    <path
                      d="M0 78 C34 122 62 122 96 78 S160 34 192 78 S256 122 288 78 S310 42 320 32"
                      pathLength="100"
                    />
                    <rect x="286" y="22" width="16" height="72" rx="8" />
                  </svg>
                </article>

                <div className="studio-grid__ai">
                  <RecommendationBox
                    variant="studio"
                    recommendation={feedbackSummary}
                    weaknesses={report.weaknesses}
                    suggestions={report.suggestions}
                    featureLabel="Interview Score with AI"
                    callout={focusLine}
                  />
                </div>

                <div className="studio-grid__chart">
                  <PerformanceChart
                    variant="studio"
                    chartItems={chartItems}
                    metrics={metrics}
                    quickStats={quickStats}
                  />
                </div>
              </div>
            </main>
          </section>
        )}
      </div>
    </div>
  );
}
