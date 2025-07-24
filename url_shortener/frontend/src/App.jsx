import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="top-bar">
      {location.pathname !== '/analytics' && (
        <button className="analytics-btn" onClick={() => navigate('/analytics')}>
          Analytics
        </button>
      )}
      {location.pathname === '/analytics' && (
        <button className="analytics-btn" onClick={() => navigate('/shorten')}>
          Shorten URL
        </button>
      )}
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="container">
      <div className="header"><span className="logo">🔗</span> URL Shortener</div>
      <div className="card">
        <h1>Welcome!</h1>
        <p className="helper">Shorten your long links and track their usage securely.</p>
        <button onClick={() => navigate('/shorten')} style={{ fontSize: 20, padding: '1em 2em', marginTop: 32 }}>
          Shorten URL
        </button>
      </div>
    </div>
  );
}

function ShortenerApp() {
  // State for shortening
  const [longUrl, setLongUrl] = useState('');
  const [shortResult, setShortResult] = useState(null);
  const [shortenError, setShortenError] = useState('');
  const [shortenLoading, setShortenLoading] = useState(false);

  // State for analytics
  const [lookupCode, setLookupCode] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTokenInput, setAnalyticsTokenInput] = useState('');

  // Backend base URL (adjust if needed)
  const API_BASE = 'http://localhost:5050';

  // Store analytics tokens in localStorage, keyed by short code
  const saveToken = (code, token) => {
    const tokens = JSON.parse(localStorage.getItem('analyticsTokens') || '{}');
    tokens[code] = token;
    localStorage.setItem('analyticsTokens', JSON.stringify(tokens));
  };
  const getToken = (code) => {
    const tokens = JSON.parse(localStorage.getItem('analyticsTokens') || '{}');
    return tokens[code];
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setShortenError('');
    setShortResult(null);
    setShortenLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to shorten URL');
      setShortResult(data);
      saveToken(data.short_code, data.analytics_token);
    } catch (err) {
      setShortenError(err.message);
    } finally {
      setShortenLoading(false);
    }
  };

  const handleCopy = () => {
    if (shortResult?.short_url) {
      navigator.clipboard.writeText(shortResult.short_url);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setAnalyticsError('');
    setAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const code = lookupCode.trim();
      let token = getToken(code);
      if (!token) {
        // If not in localStorage, use user input
        token = analyticsTokenInput.trim();
      }
      if (!token) {
        setAnalyticsError('Analytics token required.');
        setAnalyticsLoading(false);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/stats/${code}?token=${encodeURIComponent(token)}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Not found');
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const tokenNeeded = lookupCode && !getToken(lookupCode.trim());

  return (
    <div className="container">
      <TopBar />
      <div className="header"><span className="logo">🔗</span> URL Shortener</div>
      <div className="card">
        <h2>Paste your long URL below</h2>
        <div className="helper">Enter any valid URL to get a short, shareable link.</div>
        <form onSubmit={handleShorten} className="shorten-form">
          <span role="img" aria-label="link">🔗</span>
          <input
            type="url"
            placeholder="Enter a long URL to shorten"
            value={longUrl}
            onChange={e => setLongUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={shortenLoading}>
            {shortenLoading ? 'Shortening...' : 'Shorten'}
          </button>
        </form>
        {shortenError && <div className="error">{shortenError}</div>}
        {shortResult && (
          <div className="result">
            <span>Short URL: </span>
            <a href={shortResult.short_url} target="_blank" rel="noopener noreferrer">{shortResult.short_url}</a>
            <button onClick={handleCopy} style={{ marginLeft: 8 }} title="Copy to clipboard">📋 Copy</button>
            <div style={{ marginTop: 8, fontSize: 14, color: '#888' }}>
              <b>Analytics Token:</b> <code>{shortResult.analytics_token}</code><br />
              <span style={{ color: '#c00' }}>Save this token to view analytics for this URL!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  // State for analytics
  const [lookupCode, setLookupCode] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTokenInput, setAnalyticsTokenInput] = useState('');
  const API_BASE = 'http://localhost:5050';
  const getToken = (code) => {
    const tokens = JSON.parse(localStorage.getItem('analyticsTokens') || '{}');
    return tokens[code];
  };
  const handleLookup = async (e) => {
    e.preventDefault();
    setAnalyticsError('');
    setAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const code = lookupCode.trim();
      let token = getToken(code);
      if (!token) {
        token = analyticsTokenInput.trim();
      }
      if (!token) {
        setAnalyticsError('Analytics token required.');
        setAnalyticsLoading(false);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/stats/${code}?token=${encodeURIComponent(token)}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Not found');
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };
  const tokenNeeded = lookupCode && !getToken(lookupCode.trim());
  return (
    <div className="container">
      <TopBar />
      <div className="header"><span className="logo">📊</span> URL Analytics</div>
      <div className="card">
        <h2>Lookup Analytics</h2>
        <div className="helper">Enter your short code and analytics token to view stats.</div>
        <form onSubmit={handleLookup} className="analytics-form">
          <span role="img" aria-label="search">🔎</span>
          <input
            type="text"
            placeholder="Enter short code (e.g. abc123)"
            value={lookupCode}
            onChange={e => { setLookupCode(e.target.value); setAnalyticsTokenInput(''); setAnalytics(null); setAnalyticsError(''); }}
            required
          />
          {tokenNeeded && (
            <input
              type="text"
              placeholder="Enter analytics token"
              value={analyticsTokenInput}
              onChange={e => setAnalyticsTokenInput(e.target.value)}
              required
            />
          )}
          <button type="submit" disabled={analyticsLoading}>
            {analyticsLoading ? 'Loading...' : 'Get Stats'}
          </button>
        </form>
        {analyticsError && <div className="error">{analyticsError}</div>}
        {analytics && (
          <div className="result">
            <div><b>Original URL:</b> <a href={analytics.url} target="_blank" rel="noopener noreferrer">{analytics.url}</a></div>
            <div><b>Clicks:</b> {analytics.clicks}</div>
            <div><b>Created At:</b> {analytics.created_at}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/shorten" element={<ShortenerApp />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default App;
