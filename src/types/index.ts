import { Connection } from "mysql2/promise";
import { Request, Response, NextFunction } from "express";
import { SessionData } from "express-session";
// TODO: Revise
export type QueryFunction = () => Promise<any>;

interface TralseSessionData extends SessionData {
  tralse_db_mysql: {
    connectionId: string;
  };
}

export interface TralseRequest extends Request {
  session: TralseSessionData | any;
  tralse_db_mysql: {
    [key: string]: DatabaseInstance;
  }
}

export interface TralseResponse extends Response {}
export interface TralseNext extends NextFunction {}

/**
 * Interface for DatabaseObject
 */
export interface DatabaseObject {
  connection: Connection;
  referenceNo?: string | null;
  timeoutId?: string;
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
