export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-border-light border-t-accent animate-spin" />
        <span className="font-heading text-[11px] font-semibold text-text-muted tracking-[1px] uppercase">
          {message}
        </span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-error">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="font-heading text-[11px] font-semibold tracking-[1px] bg-text-primary text-text-on-dark px-4 h-9 hover:opacity-90 transition-opacity"
          >
            RETRY
          </button>
        )}
      </div>
    </div>
  );
}
