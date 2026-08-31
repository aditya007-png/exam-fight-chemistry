// src/components/exam/ExamErrorBoundary.tsx
// Production Error Boundary preventing white screen crashes during exam runtime
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../common/Button';
import { RotateCcw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ExamErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL EXAM RUNTIME ERROR CAUGHT BY BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReturnHome = () => {
    window.location.href = '/student/exams';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {this.props.fallbackTitle || 'Examination Recovered from Unexpected Error'}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                An unexpected interface or hardware error was safely caught. Your attempt progress is preserved in the database.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                <strong>Error:</strong> {this.state.error.message || 'Unknown runtime exception'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1 text-xs font-bold"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={this.handleReload}
              >
                Reload & Resume Exam
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs font-semibold"
                leftIcon={<Home className="w-4 h-4" />}
                onClick={this.handleReturnHome}
              >
                Return to My Exams
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
