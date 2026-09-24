import React from 'react';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function Landing({ onGetStarted, onLogin }: LandingProps) {
  return (
    <div className="landing-page">
      <div className="landing-inner">
        {/* Header */}
        <header className="landing-header">
          <div className="landing-logo">
            <span className="landing-logo-icon">🔥</span>
            <span className="landing-logo-text">Habit Streak Tracker</span>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onLogin}
            id="landing-login-top"
          >
            Log In
          </button>
        </header>

        {/* Hero */}
        <section className="landing-hero">
          <h1 className="landing-hero-title">
            Build habits.<br />Keep your streak.
          </h1>
          <p className="landing-hero-sub">
            Track what matters, stay consistent, and make progress one day at a time.
          </p>
          <div className="landing-hero-buttons">
            <button
              className="btn btn-primary btn-lg"
              onClick={onGetStarted}
              id="landing-get-started"
            >
              Get Started
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={onLogin}
              id="landing-login"
            >
              Log In
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className="landing-preview" aria-label="App preview">
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-streak-badge">🔥 12 day streak</span>
            </div>
            <div className="preview-habits">
              {[
                { icon: '🧘', name: 'Yoga', done: true },
                { icon: '💻', name: 'LeetCode', done: true },
                { icon: '💧', name: 'Drink 3L Water', done: true },
                { icon: '🏋️', name: 'Gym', done: false },
              ].map(h => (
                <div key={h.name} className="preview-habit-row">
                  <div className="preview-habit-left">
                    <span className="preview-habit-icon">{h.icon}</span>
                    <span className="preview-habit-name">{h.name}</span>
                  </div>
                  <span className={`preview-check ${h.done ? 'done' : ''}`}>
                    {h.done ? '✓' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="landing-benefits">
          <div className="benefit-item">
            <div className="benefit-icon">✓</div>
            <div>
              <div className="benefit-title">Track habits</div>
              <div className="benefit-desc">Check off habits daily with a single tap.</div>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🔥</div>
            <div>
              <div className="benefit-title">Build streaks</div>
              <div className="benefit-desc">Watch your consistency grow day by day.</div>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <div>
              <div className="benefit-title">See your progress</div>
              <div className="benefit-desc">Detailed stats, history, and calendar views.</div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-cta">
          <h2 className="landing-cta-title">Start building your streak.</h2>
          <button
            className="btn btn-primary btn-lg"
            onClick={onGetStarted}
            id="landing-get-started-bottom"
          >
            Get Started — it's free
          </button>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>Habit Streak Tracker · Simple habit tracking for real people.</p>
        </footer>
      </div>
    </div>
  );
}
