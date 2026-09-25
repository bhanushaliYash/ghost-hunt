import type { ReactNode } from "react";

export function Table({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <table className="data">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
