import { Connection } from "mysql2/promise";

// TODO: Revise
export type QueryFunction = () => Promise<any>;

/**
 * Interface for DatabaseObject
 */
export interface DatabaseObject {
  connection: Connection;
  referenceNo?: string | null;
  timeoutId?: number;
}

export interface DatabaseInstance {
  initializeConnection: () => Promise<void>;
  query: (sql: string, params?: any[]) => Promise<any>;
  transaction?: (isolationLevel?: string) => Promise<TransactionMethods>;
  releaseConnection: () => Promise<void>;
  terminate: () => Promise<void>;
}

export interface TransactionMethods {
  init: (
    sql: string | string[],
    params?: any | any[],
    generateReferenceNo?: (() => string) | null
  ) => Promise<any | any[]>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  retrieve: () => { connection: string; [key: string]: any };
}
