import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Loader2,
  LogIn,
  LogOut,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000"}/api`;
const axiosAuth = axios.create({ baseURL: API, withCredentials: true });

const startGoogleSignIn = () => {
  const redirectUrl = window.location.origin + "/";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

const GithubIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const UserMenu = ({ user, onSignOut }) => (
  <div className="user-chip" data-testid="user-menu-trigger">
    <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: 28, height: 28, background: '#334155', color: '#fff', fontSize: 12 }}>
      {user.picture ? <img src={user.picture} alt={user.name} style={{ borderRadius: '50%', width: '100%' }} /> : initials(user.name)}
    </div>
    <span className="user-name" data-testid="user-name">{user.name}</span>
    <button onClick={onSignOut} className="sign-in-button" style={{ marginLeft: 8, padding: '4px 8px', fontSize: 12 }}>
      <LogOut size={13} />
    </button>
  </div>
);

const Home = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    try {
      const { data } = await axiosAuth.get("/auth/me");
      setUser(data);
    } catch (_) {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (match) {
      const sessionId = decodeURIComponent(match[1]);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      axiosAuth
        .post("/auth/session", null, { headers: { "X-Session-ID": sessionId } })
        .then(() => loadCurrentUser())
        .catch(() => setAuthChecked(true));
      return;
    }
    loadCurrentUser();
  }, [loadCurrentUser]);

  const analyze = async (event) => {
    event.preventDefault();
    if (text.trim().split(/\s+/).length < 3) {
      setError("Enter at least 3 words to start an analysis.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await axios.post(`${API}/analyze`, { text: text.trim() });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis unavailable right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const signOut = async () => {
    try {
      await axiosAuth.post("/auth/logout");
    } catch (_) {
      // ignore
    }
    setUser(null);
  };

  const isReal = result?.verdict?.toUpperCase() === "REAL";
  const verdictClass = result ? (isReal ? "credible" : "misleading") : "";

  return (
    <main className="app-shell">
      <nav className="topbar" data-testid="app-navigation">
        <div className="brand" data-testid="brand-name">
          <span className="brand-mark">
            <ShieldCheck size={18} />
          </span>
          <span>FAKE NEWS DETECTOR</span>
        </div>
        <div className="topbar-right">
          <div className="status-pill" data-testid="system-status">
            <span className="status-dot" /> ANALYSIS SYSTEM ONLINE
          </div>
          {authChecked && (
            user ? (
              <UserMenu user={user} onSignOut={signOut} />
            ) : (
              <button
                className="sign-in-button"
                data-testid="sign-in-button"
                onClick={startGoogleSignIn}
                type="button"
              >
                <LogIn size={15} /> Sign in
              </button>
            )
          )}
        </div>
      </nav>
      <section className="workspace">
        <div className="intro reveal">
          <div className="eyebrow">
            <ScanSearch size={14} /> CREDIBILITY ENGINE / 01
          </div>
          <h1>
            Fake News<br />
            <em>Detector</em>
          </h1>
          <p className="intro-copy">
            Paste a news story. The detector reads the language, claims, and context to give you a
            clear first read.
          </p>
        </div>
        <div className="detector-panel reveal delay-one">
          {!result ? (
            <form onSubmit={analyze} data-testid="news-analysis-form">
              <div className="panel-heading">
                <div>
                  <span className="section-label">INPUT CHANNEL</span>
                  <h2>What did you read?</h2>
                </div>
                <span className="counter" data-testid="character-counter">
                  {text.length.toLocaleString()} / 12,000
                </span>
              </div>
              <textarea
                data-testid="news-text-input"
                maxLength={12000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full news text here…"
                aria-label="News text"
              />
              {error && (
                <div className="error-message" data-testid="analysis-error">
                  <CircleAlert size={16} /> {error}
                </div>
              )}
              <div className="form-footer">
                <span className="privacy-note">
                  <ShieldCheck size={15} /> Text is analyzed securely
                </span>
                <button
                  data-testid="analyze-news-button"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="spin" size={17} /> Reading signal…
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} /> Analyze story <ArrowUpRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className={`result-view ${verdictClass}`} data-testid="analysis-result">
              <div className="result-top">
                <span className="section-label">ANALYSIS COMPLETE</span>
                <span className="result-id" data-testid="analysis-id">
                  ID / {result.id ? result.id.slice(0, 8).toUpperCase() : "N/A"}
                </span>
              </div>
              <div className="verdict-block">
                <div className="verdict-icon">
                  {isReal ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <CircleAlert size={28} />
                  )}
                </div>
                <div>
                  <p className="section-label">VERDICT</p>
                  <h2 data-testid="analysis-verdict">{result.verdict}</h2>
                </div>
              </div>
              <div className="truth-score-block">
                <div className="truth-score-header">
                  <span className="section-label">TRUTH SCORE</span>
                  <span className="truth-scale">0 = FALSE · 100 = TRUE</span>
                </div>
                <div className="truth-score-value" data-testid="analysis-truth-score">
                  {result.truth_score}
                  <span className="truth-percent">%</span>
                </div>
                <div className="confidence-track">
                  <span style={{ width: `${Math.min(Math.max(result.truth_score, 0), 100)}%` }} />
                </div>
              </div>
              <p className="result-disclaimer">
                This result comes from a trained linguistic classification model, not a final
                fact-check. Verify important claims with trusted sources.
              </p>
              {result.note && (
                <p className="result-note" data-testid="analysis-note">
                  <AlertTriangle size={14} /> {result.note}
                </p>
              )}
              <button
                data-testid="new-analysis-button"
                className="secondary-button"
                onClick={reset}
              >
                <RotateCcw size={16} /> Analyze another story
              </button>
            </div>
          )}
        </div>
      </section>
      <footer className="site-footer" data-testid="site-footer">
        <div className="footer-notice" data-testid="ai-disclaimer">
          <AlertTriangle size={16} />{" "}
          <span>
            Predictions are based on a trained linguistic model. Always verify critical information
            independently.
          </span>
        </div>
        <div className="footer-bottom">
          <div className="copyright" data-testid="copyright-notice">
            <Activity size={17} /> <span>© 2026 Fake News Detector. All rights reserved.</span>
          </div>
          <div className="footer-links">
            <a data-testid="privacy-policy-link" href="#privacy">
              Privacy Policy
            </a>
            <a data-testid="contact-link" href="mailto:contact@fakenewsdetector.app">
              Contact
            </a>
            <a
              data-testid="github-link"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon size={16} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default function App() {
  return (
    <div className="App">
      <Home />
    </div>
  );
}