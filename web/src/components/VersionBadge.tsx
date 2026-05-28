// Build commit SHA, injected by vite.config.ts. Guarded so it never throws if undefined.
const sha = typeof __COMMIT_SHA__ !== 'undefined' ? __COMMIT_SHA__ : '';

export function VersionBadge({ className }: { className?: string }) {
  return (
    <span className={className} title={sha || undefined}>
      build {sha ? sha.slice(0, 7) : 'dev'}
    </span>
  );
}
