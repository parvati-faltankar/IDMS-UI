// ─── Slot Preview Panel ───────────────────────────────────────────────────────
// Right-panel live preview: day-by-day accordion of generated slots.

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Calendar, Hash } from 'lucide-react';
import { generateSlots } from '../services/slotService';
import type { GenerateConfig } from '../services/slotService';
import type { DayOfWeek } from '../types/slotMaster.types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlotPreviewPanelProps {
  startDate: string;
  endDate: string;
  slotStartTime: string;
  slotEndTime: string;
  slotDurationMin: number;
  timeGapMin: number;
  activeDays: DayOfWeek[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sPanel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  background: 'var(--color-surface-subtle)',
  borderLeft: '1px solid var(--color-border)',
};

const sHeader: React.CSSProperties = {
  padding: '14px 16px 10px',
  borderBottom: '1px solid var(--color-border)',
  flexShrink: 0,
};

const sBody: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '8px 10px',
};

const sEmpty: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: '32px 16px', gap: '10px', color: 'var(--color-text-muted)',
  textAlign: 'center',
};

const sDayRow: React.CSSProperties = {
  borderRadius: '8px', marginBottom: '6px', overflow: 'hidden',
  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
};

const sDayHead = (expanded: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px',
  cursor: 'pointer', userSelect: 'none',
  background: expanded ? 'color-mix(in srgb, var(--color-primary) 6%, transparent)' : 'transparent',
  borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
});

const sChip: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, padding: '2px 7px',
  borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8',
  border: '1px solid #BFDBFE', whiteSpace: 'nowrap',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SlotPreviewPanel: React.FC<SlotPreviewPanelProps> = ({
  startDate, endDate, slotStartTime, slotEndTime,
  slotDurationMin, timeGapMin, activeDays,
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const isConfigured =
    startDate && endDate && slotStartTime && slotEndTime && slotDurationMin > 0;

  const config: GenerateConfig = {
    startDate, endDate, slotStartTime, slotEndTime,
    slotDurationMin, timeGapMin, activeDays,
  };

  const activeDaysKey = activeDays.slice().sort().join(',');
  const generatedDays = useMemo(
    () => (isConfigured ? generateSlots(config) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startDate, endDate, slotStartTime, slotEndTime, slotDurationMin, timeGapMin, activeDaysKey],
  );

  const totalSlots = generatedDays.reduce((sum, d) => sum + d.slots.length, 0);
  const dailySlots = generatedDays.length > 0 ? generatedDays[0].slots.length : 0;

  function toggleDay(date: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) { next.delete(date); } else { next.add(date); }
      return next;
    });
  }

  // ── Empty / not-configured state ──────────────────────────────────────────
  if (!isConfigured) {
    return (
      <div style={sPanel}>
        <div style={sHeader}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Live Slot Preview
          </p>
        </div>
        <div style={sEmpty}>
          <Calendar size={32} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            No preview yet
          </p>
          <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
            Fill in dates, start/end time and duration to see generated slots here.
          </p>
        </div>
      </div>
    );
  }

  if (generatedDays.length === 0) {
    return (
      <div style={sPanel}>
        <div style={sHeader}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Live Slot Preview
          </p>
        </div>
        <div style={sEmpty}>
          <Calendar size={32} style={{ color: '#FCA5A5' }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', margin: 0 }}>
            No slots generated
          </p>
          <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
            No working days found in the selected range, or the time window is too short for the configured duration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={sPanel}>
      {/* Header with summary stats */}
      <div style={sHeader}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
          Live Slot Preview
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#15803D', background: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>
            <Hash size={10} />
            {totalSlots} total slots
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
            <Calendar size={10} />
            {generatedDays.length} days
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#B45309', background: '#FFFBEB', padding: '3px 8px', borderRadius: '6px' }}>
            <Clock size={10} />
            {dailySlots}/day
          </div>
        </div>
      </div>

      {/* Day-by-day accordion */}
      <div style={sBody}>
        {generatedDays.map((day) => {
          const expanded = expandedDays.has(day.date);
          return (
            <div key={day.date} style={sDayRow}>
              <div style={sDayHead(expanded)} onClick={() => toggleDay(day.date)}>
                {expanded
                  ? <ChevronDown size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  : <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                }
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>
                  {day.dayLabel}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                  borderRadius: '4px', background: '#F1F5F9', color: '#64748B',
                }}>
                  {day.slots.length} slot{day.slots.length !== 1 ? 's' : ''}
                </span>
              </div>

              {expanded && (
                <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {day.slots.map((slot, i) => (
                    <span key={i} style={sChip}>
                      {slot.startTime} – {slot.endTime}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
