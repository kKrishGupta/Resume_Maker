import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import PerformanceChart from "../components/PerformanceChart";
import RecommendationBox from "../components/RecommendationBox";
import ScoreCard from "../components/ScoreCard";
import { useDashboard } from "../hooks/useDashboard";
import "../styles/dashboard.scss";

const buildInsightList = (items = []) =>
  items.map((item) => (
    <li key={item}>
      <span>{item}</span>
    </li>
  ));

export default function ReportPage() {
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

  const focusAreas = report.skillGaps.length ? report.skillGaps : report.missingKeywords;

  return (
    <div className="candidate-dashboard candidate-dashboard--report">
      <div className="candidate-shell">
        <header className="candidate-hero candidate-hero--report">
          <div className="candidate-hero__copy">
            <p className="candidate-hero__eyebrow">Candidate Report</p>
            <h1>{report.title || "Detailed Interview Report"}</h1>
            <p>
              Dive into your performance breakdown, strengths, and the next areas to
              improve before the next interview round.
            </p>
          </div>

          <div className="candidate-hero__actions">
            <Link
              className="candidate-ghost-btn"
              to="/dashboard"
              state={{ reportSummary: report, reportId, sessionId }}
            >
              Back to Dashboard
            </Link>

            <button
              type="button"
              className="candidate-primary-btn"
              onClick={() => void refreshReport()}
              disabled={isSyncing}
            >
              {isSyncing ? "Refreshing..." : "Refresh Report"}
            </button>
          </div>
        </header>

        {error && !hasReport ? (
          <div className="dashboard-banner dashboard-banner--error">{error}</div>
        ) : null}

        {error && hasReport ? (
          <div className="dashboard-banner">
            Live sync is unavailable right now. Showing the latest saved report.
          </div>
        ) : null}

        {loading && !hasReport ? (
          <div className="dashboard-loading">Loading the full interview report...</div>
        ) : !hasReport ? (
          <div className="dashboard-empty">
            No detailed report is available yet. Complete an interview to unlock this page.
          </div>
        ) : (
          <>
            <section className="candidate-grid">
              <ScoreCard
                score={report.score}
                title={report.title}
                status={report.status}
                totalQuestions={report.totalQuestions}
                trustScore={report.trustScore}
                createdAt={report.createdAt}
              />

              <PerformanceChart metrics={metrics} quickStats={quickStats} />
            </section>

            <section className="dashboard-detail-grid">
              <RecommendationBox
                recommendation={report.recommendation}
                strengths={report.strengths}
                weaknesses={report.weaknesses}
                suggestions={report.suggestions}
              />

              <article className="dashboard-card insight-card">
                <div className="insight-card__header">
                  <div>
                    <p className="dashboard-card__eyebrow">Growth Plan</p>
                    <h2>Focus Areas</h2>
                  </div>
                  <span className="insight-card__badge">
                    {focusAreas.length + report.suggestions.length}
                  </span>
                </div>

                {focusAreas.length ? (
                  <section className="insight-card__section">
                    <h3>Priority topics</h3>
                    <ul>{buildInsightList(focusAreas)}</ul>
                  </section>
                ) : null}

                {report.suggestions.length ? (
                  <section className="insight-card__section">
                    <h3>Recommended actions</h3>
                    <ul>{buildInsightList(report.suggestions)}</ul>
                  </section>
                ) : null}

                {!focusAreas.length && !report.suggestions.length ? (
                  <div className="dashboard-empty dashboard-empty--compact">
                    More detailed coaching insights will appear here when the report API
                    returns them.
                  </div>
                ) : null}
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
