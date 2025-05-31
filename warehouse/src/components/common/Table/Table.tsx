import React from 'react';
import styles from './Table.module.scss';

interface Column {
  key: string;
  title: string;
  render?: (value: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false
}) => {
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={styles.th}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className={styles.tr}>
              {columns.map((column) => (
                <td key={`${index}-${column.key}`} className={styles.td}>
                  {column.render
                    ? column.render(row[column.key], row) // truyền thêm row vào render
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};