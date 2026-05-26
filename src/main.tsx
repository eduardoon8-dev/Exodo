import React, {StrictMode, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-red-400 p-8 flex flex-col justify-center items-center font-mono">
          <div className="max-w-2xl bg-red-950/20 border border-red-500/30 rounded-2xl p-6 text-left space-y-4">
            <h2 className="text-xl font-bold text-red-500">Erro de Inicialização detectado no Navegador:</h2>
            <p className="text-sm font-semibold">{this.state.error?.toString()}</p>
            <details className="text-xs text-gray-400 whitespace-pre-wrap cursor-pointer">
              <summary className="font-sans text-red-400 underline mb-2">Ver Detalhes do Erro</summary>
              {this.state.error?.stack}
            </details>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

