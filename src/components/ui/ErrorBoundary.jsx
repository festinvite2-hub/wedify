import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Wedify Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--fd)', color: 'var(--er)' }}>Ceva nu a mers bine</h2>
          <p style={{ color: 'var(--gr)', margin: '12px 0' }}>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '10px 24px', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Încearcă din nou
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
