/** Breadcrumb trail: earlier pages are links (buttons, since pages are in-app state), the last is the current page. */
export function Crumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="cg-crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) =>
          i === items.length - 1 || !it.onClick ? (
            <li key={it.label} aria-current={i === items.length - 1 ? 'page' : undefined}>
              {it.label}
            </li>
          ) : (
            <li key={it.label}>
              <button type="button" onClick={it.onClick}>
                {it.label}
              </button>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
