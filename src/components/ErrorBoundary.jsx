import { Component } from 'react';

// Without this, any uncaught error during render tears down the entire React
// tree with zero feedback -- exactly the "white screen, no explanation"
// symptom. This catches that, shows a recoverable screen instead, and (in
// dev) prints the real error so it can be diagnosed from a screenshot.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur applicative interceptée :', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          background: '#F0F2F8', fontFamily: "'Segoe UI',system-ui,sans-serif",
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: '#1A1A2E', margin: '0 0 8px' }}>Une erreur est survenue</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 20, maxWidth: 320 }}>
            Rechargez la page pour continuer. Si le problème persiste, faites une capture d'écran de ce message pour le signaler.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: '#fff', border: '1px solid #eee', borderRadius: 10,
              padding: 12, fontSize: 11, color: '#E63946', maxWidth: 380,
              overflow: 'auto', textAlign: 'left', marginBottom: 20,
            }}>{String(this.state.error?.message || this.state.error)}</pre>
          )}
          <button onClick={() => window.location.reload()} style={{
            padding: '12px 24px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#E63946,#FF9F1C)',
            color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}>
            🔄 Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
