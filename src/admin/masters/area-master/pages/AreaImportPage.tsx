import AdminShell from '../../../AdminShell';

const AreaImportPage = () => {
  return (
    <AdminShell>
      <div style={{ padding: '40px 48px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
          Area Bulk Import
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '480px', lineHeight: 1.6 }}>
          Bulk import preview and processing will be implemented in a later phase.
        </p>
      </div>
    </AdminShell>
  );
};

export default AreaImportPage;
