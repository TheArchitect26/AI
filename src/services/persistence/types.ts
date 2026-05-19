export type SqlValue = string | number | bigint | Uint8Array | null;

export type Row = Record<string, SqlValue>;

export type QueryResult<T extends Row = Row> = {
  rows: T[];
};

export interface PersistenceAdapter {
  init(): void;
  query<T extends Row = Row>(sql: string, params?: SqlValue[]): QueryResult<T>;
  execute(sql: string, params?: SqlValue[]): void;
  close(): void;
}
