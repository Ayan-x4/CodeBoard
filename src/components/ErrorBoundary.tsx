import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('CodeBoard rendering error', error, info); }
  render() {
    if (this.state.error) return <div className="fatal-error"><AlertTriangle size={32} /><h1>Let’s get your workspace back.</h1><p>{this.state.error}</p><button className="primary-button" onClick={() => location.reload()}>Reload CodeBoard</button><small>Saved projects are kept in your browser.</small></div>;
    return this.props.children;
  }
}
