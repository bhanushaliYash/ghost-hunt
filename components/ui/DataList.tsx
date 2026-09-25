export function DataList({ items }: { items: { href: string; title: string; meta: string }[] }) {
  if (!items.length) return <p className="quiet">Nothing in this list yet.</p>;
  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.href + item.title}>
          <a href={item.href}>{item.title}</a>
          <span className="meta">{item.meta}</span>
        </li>
      ))}
    </ul>
  );
}
