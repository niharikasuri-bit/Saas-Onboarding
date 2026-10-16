import { useId, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';

export type TreeNode = { id: string; name: string; parentId: string | null };

/**
 * A searchable tree for large hierarchies. Children render only when their
 * parent is opened (lazy), and search shows matches with their full path.
 */
export function SearchTree({
  label,
  nodes,
  meta,
  action,
}: {
  label: string;
  nodes: TreeNode[];
  meta?: (n: TreeNode) => string;
  action?: (n: TreeNode) => React.ReactNode;
}) {
  const uid = useId();
  const [q, setQ] = useState('');
  const kids = useMemo(() => {
    const m = new Map<string | null, TreeNode[]>();
    for (const n of nodes) m.set(n.parentId, [...(m.get(n.parentId) ?? []), n]);
    return m;
  }, [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const path = (n: TreeNode) => {
    const out: string[] = [];
    let p = n.parentId ? byId.get(n.parentId) : undefined;
    while (p) {
      out.unshift(p.name);
      p = p.parentId ? byId.get(p.parentId) : undefined;
    }
    return out.join(' › ');
  };
  const roots = nodes.filter((n) => !n.parentId || !byId.has(n.parentId));
  const term = q.trim().toLowerCase();
  const matches = term ? nodes.filter((n) => n.name.toLowerCase().includes(term)).slice(0, 50) : [];

  return (
    <div className="st">
      <div className="search">
        <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
          Search {label}
        </label>
        <Icon name="Search" size={20} />
        <input
          id={`${uid}-q`}
          type="search"
          placeholder={`Search ${label}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <p className="ux-visually-hidden" role="status">
        {term ? `${matches.length} found` : ''}
      </p>
      {term ? (
        <ul className="st-flat">
          {matches.map((n) => (
            <li key={n.id} className="node">
              <span className="node-name">{n.name}</span>
              <span className="node-level">{path(n) || 'Top level'}</span>
              {meta && <span className="node-count">{meta(n)}</span>}
              {action && <span className="node-actions">{action(n)}</span>}
            </li>
          ))}
          {!matches.length && <li className="countries-none">Nothing matches “{q}”.</li>}
        </ul>
      ) : (
        <ul className="tree">
          {roots.map((n) => (
            <Branch key={n.id} node={n} kids={kids} meta={meta} action={action} depth={0} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Branch({
  node,
  kids,
  meta,
  action,
  depth,
}: {
  node: TreeNode;
  kids: Map<string | null, TreeNode[]>;
  meta?: (n: TreeNode) => string;
  action?: (n: TreeNode) => React.ReactNode;
  depth: number;
}) {
  const children = kids.get(node.id) ?? [];
  const [open, setOpen] = useState(depth === 0);
  return (
    <li>
      <div className="node">
        {children.length ? (
          <button
            type="button"
            className="node-toggle"
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
            onClick={() => setOpen(!open)}
          >
            <Icon name="ExpandMore" size={18} />
          </button>
        ) : (
          <span className="node-toggle is-leaf" aria-hidden="true" />
        )}
        <span className="node-name">{node.name}</span>
        {children.length > 0 && <span className="node-count">{children.length} inside</span>}
        {meta && <span className="node-level">{meta(node)}</span>}
        {action && <span className="node-actions">{action(node)}</span>}
      </div>
      {open && children.length > 0 && (
        <ul>
          {children.map((c) => (
            <Branch key={c.id} node={c} kids={kids} meta={meta} action={action} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
