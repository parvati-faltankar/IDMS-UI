import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { validateViewMetadata } from '../validation/validateViewMetadata';
import { groupValidationIssues } from './validationPresentation';
import type { BuilderDraftState } from './types';
import type { ValidationIssue } from '../types';

type BuilderValidationPanelProps = {
  draft: BuilderDraftState;
  onJumpTo?: (path: string) => void;
};

function IssueRow({ issue, onJump }: { issue: ValidationIssue; onJump?: (path: string) => void }) {
  const icon =
    issue.severity === 'error' ? <AlertCircle size={13} className="val-issue__icon val-issue__icon--error" /> :
    issue.severity === 'warning' ? <AlertTriangle size={13} className="val-issue__icon val-issue__icon--warn" /> :
    <Info size={13} className="val-issue__icon val-issue__icon--info" />;

  return (
    <div className={`val-issue val-issue--${issue.severity}`}>
      {icon}
      <span className="val-issue__code">{issue.code}</span>
      {issue.path && <span className="val-issue__path">{issue.path}</span>}
      {issue.path && onJump && (
        <button
          type="button"
          className="val-issue__jump"
          onClick={() => onJump(issue.path!)}
          aria-label={`Jump to ${issue.path}`}
        >
          Go to →
        </button>
      )}
    </div>
  );
}

export default function BuilderValidationPanel({ draft, onJumpTo }: BuilderValidationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const validation = validateViewMetadata(draft.metadata);
  const grouped = groupValidationIssues(validation.issues);
  const errorCount = grouped.blocking.length;
  const warnCount = grouped.warning.length;
  const infoCount = grouped.info.length;
  const total = validation.issues.length;

  const allIssues: ValidationIssue[] = [...grouped.blocking, ...grouped.warning, ...grouped.info];

  return (
    <div data-testid="builder-validation-panel" className="val-panel">
      {/* Sticky compact bar */}
      <div className="val-bar">
        <div className="val-bar__counts">
          {errorCount > 0 && (
            <span className="val-count val-count--error">
              <AlertCircle size={12} /> {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="val-count val-count--warn">
              <AlertTriangle size={12} /> {warnCount} warning{warnCount > 1 ? 's' : ''}
            </span>
          )}
          {infoCount > 0 && (
            <span className="val-count val-count--info">
              <Info size={12} /> {infoCount} info
            </span>
          )}
          {total === 0 && (
            <span className="val-count val-count--ok">✓ No issues</span>
          )}
        </div>
        {total > 0 && (
          <button
            type="button"
            className="val-bar__toggle"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label="Toggle issues detail"
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            {expanded ? 'Hide' : 'Details'}
          </button>
        )}
      </div>

      {/* Expandable issues drawer */}
      {expanded && total > 0 && (
        <div className="val-drawer" role="list" aria-label="Validation issues">
          {allIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} onJump={onJumpTo} />
          ))}
        </div>
      )}
    </div>
  );
}

