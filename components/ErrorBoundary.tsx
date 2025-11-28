import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console for now; could send to analytics
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message ?? 'Erro desconhecido';
      const stack = (this.state.error && (this.state.error.stack ?? '')) as string;
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
          <h1 style={{ color: '#b91c1c' }}>Ocorreu um erro</h1>
          <p style={{ color: '#374151' }}>{message}</p>
          <pre style={{ background: '#111827', color: '#e5e7eb', padding: 12, borderRadius: 6, overflow: 'auto' }}>{stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
