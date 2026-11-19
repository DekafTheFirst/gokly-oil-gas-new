import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An unexpected error occurred. You can try again or head back to the homepage.
          </p>
          {this.state.error && (
            <p className="mt-3 break-words rounded-lg bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reload page
            </Button>
            <Button asChild className="gap-2">
              <a href="/">
                <Home className="h-4 w-4" />
                Go home
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
