import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
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
        <div className="h-screen flex items-center justify-center bg-[#001324]">
          <Alert className="max-w-lg bg-red-500/10 border-red-500/20">
            <AlertDescription>
              Something went wrong. Please refresh the page or try again later.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
