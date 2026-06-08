import React, { useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Rows3, Search, AlertTriangle } from 'lucide-react';
import type { HierarchyNode } from '../types/warehouse.types';

export interface FlattenedHierarchyItem {
  readonly id: string;
  readonly depth: number;
  readonly node: HierarchyNode;
  readonly path: string[];
}

function collectMatchIds(nodes: HierarchyNode[], query: string): Set<string> {
  if (!query.trim()) return new Set();
  const q = query.trim().toLowerCase();
  const ids = new Set<string>();

  function visit(node: HierarchyNode, lineage: string[]) {
    const text = [
      node.locationCode ?? '',
      node.locationName ?? '',
      node.levelName,
      node.fullCode,
    ].join(' ').toLowerCase();
    const nextLineage = [...lineage, node.id];
    const matched = text.includes(q);
    const childMatched = node.children.some((child) => {
      const before = ids.size;
      visit(child, nextLineage);
      return ids.size > before;
    });

    if (matched || childMatched) {
      nextLineage.forEach((id) => ids.add(id));
    }
  }

  nodes.forEach((node) => visit(node, []));
  return ids;
}

export function flattenHierarchyItems(
  nodes: HierarchyNode[],
  expandedIds: Set<string>,
  search = '',
  visibleNodeIds?: Set<string>,
): FlattenedHierarchyItem[] {
  const filteredIds = collectMatchIds(nodes, search);
  const items: FlattenedHierarchyItem[] = [];
  const filterActive = search.trim().length > 0;
  const issueFilterActive = Boolean(visibleNodeIds && visibleNodeIds.size > 0);

  function hasVisibleDescendant(node: HierarchyNode): boolean {
    if (!visibleNodeIds) return false;
    return node.children.some((child) => visibleNodeIds.has(child.id) || hasVisibleDescendant(child));
  }

  function visit(node: HierarchyNode, depth: number, path: string[]) {
    if (filterActive && !filteredIds.has(node.id)) return;
    if (issueFilterActive && !visibleNodeIds?.has(node.id) && !hasVisibleDescendant(node)) return;
    const nextPath = [...path, node.id];
    items.push({ id: node.id, depth, node, path: nextPath });
    const shouldExpand = filterActive || expandedIds.has(node.id);
    if (shouldExpand) {
      node.children.forEach((child) => visit(child, depth + 1, nextPath));
    }
  }

  nodes.forEach((node) => visit(node, 0, []));
  return items;
}

export function getTreeKeyboardTarget(
  items: FlattenedHierarchyItem[],
  selectedId: string | null,
  key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End',
): string | null {
  if (items.length === 0) return null;
  const index = selectedId ? items.findIndex((item) => item.id === selectedId) : -1;
  if (key === 'Home') return items[0].id;
  if (key === 'End') return items[items.length - 1].id;
  if (key === 'ArrowDown') {
    const nextIndex = index < 0 ? 0 : Math.min(index + 1, items.length - 1);
    return items[nextIndex].id;
  }
  const prevIndex = index < 0 ? 0 : Math.max(index - 1, 0);
  return items[prevIndex].id;
}

interface HierarchyTreeProps {
  nodes: HierarchyNode[];
  selectedId: string | null;
  expandedIds: Set<string>;
  searchValue: string;
  issueNodeIds?: Set<string>;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onAddChild?: (id: string) => void;
  onBulkCreate?: (id: string) => void;
  visibleNodeIds?: Set<string>;
}

export function HierarchyTree({
  nodes,
  selectedId,
  expandedIds,
  searchValue,
  issueNodeIds,
  onSearchChange,
  onSelect,
  onToggle,
  onExpandAll,
  onCollapseAll,
  onAddChild,
  onBulkCreate,
  visibleNodeIds,
}: HierarchyTreeProps) {
  const treeRef = useRef<HTMLDivElement | null>(null);
  const visibleItems = useMemo(
    () => flattenHierarchyItems(nodes, expandedIds, searchValue, visibleNodeIds),
    [expandedIds, nodes, searchValue, visibleNodeIds],
  );

  function focusTree() {
    treeRef.current?.focus();
  }

  function handleTreeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentItem = visibleItems.find((item) => item.id === selectedId) ?? null;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const nextId = getTreeKeyboardTarget(visibleItems, selectedId, event.key);
      if (nextId) onSelect(nextId);
      return;
    }

    if (event.key === 'ArrowRight' && currentItem) {
      event.preventDefault();
      if (currentItem.node.children.length > 0 && !expandedIds.has(currentItem.id)) {
        onToggle(currentItem.id);
      } else if (currentItem.node.children.length > 0) {
        onSelect(currentItem.node.children[0].id);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && currentItem) {
      event.preventDefault();
      if (currentItem.node.children.length > 0 && expandedIds.has(currentItem.id)) {
        onToggle(currentItem.id);
        return;
      }
      const parentId = currentItem.path[currentItem.path.length - 2] ?? null;
      if (parentId) onSelect(parentId);
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && selectedId) {
      event.preventDefault();
      onSelect(selectedId);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search location code, name, or path"
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={onExpandAll} style={toolbarBtn}>
            Expand all
          </button>
          <button type="button" onClick={onCollapseAll} style={toolbarBtn}>
            Collapse all
          </button>
        </div>
      </div>

      <div
        ref={treeRef}
        role="tree"
        aria-label="Warehouse hierarchy tree"
        aria-activedescendant={selectedId ? `treeitem-${selectedId}` : undefined}
        tabIndex={0}
        onKeyDown={handleTreeKeyDown}
        style={{ flex: 1, overflowY: 'auto', padding: '8px', outline: 'none' }}
      >
        {visibleItems.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {searchValue.trim() ? 'No hierarchy nodes match this search.' : 'No hierarchy nodes available yet.'}
          </div>
        ) : (
          visibleItems.map((item) => {
            const issue = issueNodeIds?.has(item.id) ?? false;
            const expanded = expandedIds.has(item.id);
            const hasChildren = item.node.children.length > 0;
            const selected = item.id === selectedId;

            return (
              <div
                key={item.id}
                id={`treeitem-${item.id}`}
                role="treeitem"
                aria-selected={selected}
                aria-expanded={hasChildren ? expanded : undefined}
                aria-level={item.depth + 1}
                data-testid={`tree-node-${item.id}`}
                onClick={() => {
                  onSelect(item.id);
                  focusTree();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  margin: '2px 0',
                  borderRadius: '10px',
                  background: selected ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent',
                  border: selected ? '1px solid color-mix(in srgb, var(--color-primary) 35%, var(--color-border))' : '1px solid transparent',
                  cursor: 'pointer',
                  marginLeft: `${item.depth * 16}px`,
                }}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (hasChildren) onToggle(item.id);
                  }}
                  aria-label={expanded ? 'Collapse node' : 'Expand node'}
                  style={{ ...iconBtn, visibility: hasChildren ? 'visible' : 'hidden' }}
                >
                  {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '999px', background: nodeTypeColor(item.node.levelCode) }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {item.node.levelName}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {item.node.locationCode}
                    </span>
                    {issue && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#92400E' }}>
                        <AlertTriangle size={12} style={{ color: '#D97706' }} />
                        Issue
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.node.locationName} · Full ID: {item.node.fullCode}
                  </div>
                </div>
                {onAddChild && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddChild(item.id);
                    }}
                    title="Add child"
                    style={iconBtn}
                  >
                    <Plus size={12} />
                  </button>
                )}
                {onBulkCreate && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onBulkCreate(item.id);
                    }}
                    title="Bulk create"
                    style={iconBtn}
                  >
                    <Rows3 size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const toolbarBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 10px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  fontSize: '12px',
  color: 'var(--color-text)',
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '7px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  flexShrink: 0,
};

function nodeTypeColor(levelCode: string): string {
  const normalized = levelCode.trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  const palette = ['#0EA5E9', '#16A34A', '#F97316', '#4F46E5', '#D97706', '#059669', '#A855F7'];
  return palette[Math.abs(hash) % palette.length];
}
