import type { ReactNode } from 'react';

type BuilderShellProps = {
  topBar: ReactNode;
  leftPanel: ReactNode;
  canvas: ReactNode;
  rightPanel: ReactNode;
  bottomPanel: ReactNode;
};

export default function BuilderShell({ topBar, leftPanel, canvas, rightPanel, bottomPanel }: BuilderShellProps) {
  return (
    <div data-testid="builder-shell" className="ui-studio-shell">
      <div className="ui-studio-shell__topbar">{topBar}</div>
      <div className="ui-studio-shell__main">
        <aside data-testid="builder-panel-left" className="ui-studio-shell__panel ui-studio-shell__panel--left">
          {leftPanel}
        </aside>
        <main className="ui-studio-shell__canvas" data-testid="builder-canvas-wrap">{canvas}</main>
        <aside data-testid="builder-panel-right" className="ui-studio-shell__panel ui-studio-shell__panel--right">
          {rightPanel}
        </aside>
      </div>
      <footer data-testid="builder-panel-bottom" className="ui-studio-shell__footer">
        {bottomPanel}
      </footer>
    </div>
  );
}
