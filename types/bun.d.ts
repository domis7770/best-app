declare module "bun:sqlite" {
  export interface Statement<Row = Record<string, unknown>> {
    get(...params: unknown[]): Row | null;
    all(...params: unknown[]): Row[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    values(...params: unknown[]): unknown[][];
  }

  export interface DatabaseOptions {
    readonly?: boolean;
    create?: boolean;
    strict?: boolean;
  }

  export class Database {
    constructor(filename?: string, options?: DatabaseOptions);
    prepare<Row = Record<string, unknown>>(sql: string): Statement<Row>;
    exec(sql: string): this;
    query<Row = Record<string, unknown>>(sql: string): Statement<Row>;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
    close(): void;
  }
}
