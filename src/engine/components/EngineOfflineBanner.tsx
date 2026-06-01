type EngineOfflineBannerProps = {
  message?: string;
};

export function EngineOfflineBanner({ message }: EngineOfflineBannerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: 8,
        fontSize: 13,
        color: '#92400e',
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 16 }}>⚡</span>
      <span>
        <strong>Engine backend not connected.</strong>{' '}
        {message ?? 'Rule Engine, Workflow Engine, and Services are unavailable. Actions are disabled until the backend is reachable.'}
      </span>
    </div>
  );
}
