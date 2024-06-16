import { PoolConnection as Connection, QueryResult } from "mysql2/promise";
import { Request, Response, NextFunction } from "express";
import { SessionData } from "express-session";
// TODO: Revise
export type QueryFunction = () => Promise<any>;

/**
 * Options for configuring the behavior of the executeDbQuery function.
 */
export interface ExecuteDbQueryOptions {
  /**
   * Indicates whether to execute the queries in parallel.
   */
  parallel: boolean;
}

export interface TralseSessionData extends SessionData {
  tralse_db_mysql: {
    connectionId: string;
  };
}

export interface TralseRequest extends Request {
  session: TralseSessionData | any;
  tralse_db_mysql: {
    [key: string]: DatabaseInstance;
  };
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
  /**
   * Initializes a mysql connection and serializes it into the request.
   *
   * @returns A promise that resolves when the connection is initialized.
   * @throws DatabaseError - If there is an error initializing the database connection.
   */
  initializeConnection: () => Promise<void>;
  /**
   * Executes a database query.
   *
   * @param sql - The SQL query string to execute.
   * @param params - The parameters for the SQL query.
   * @returns A promise that resolves with the query result.
   * @throws DatabaseError - If there is an error executing the query.
   */
  query: (
    sql: string,
    params: any[],
    options?: ExecuteDbQueryOptions
  ) => Promise<QueryResult | QueryResult[]>;
  /**
   * Begins a database transaction.
   *
   * @returns A promise that resolves with the transaction methods.
   * @throws DatabaseError - If there is an error initializing the transaction.
   */
  transaction?: () => Promise<TransactionMethods>;
  /**
   * Releases the current mysql connection.
   *
   * @returns A promise that resolves when the connection is released.
   * @throws DatabaseError - If there is an error releasing the connection.
   */
  releaseConnection: () => Promise<void>;
  /**
   * Terminates the mysql connection pool.
   *
   * @returns A promise that resolves when the connection pool is terminated.
   * @throws DatabaseError - If there is an error terminating the connection pool.
   */
  terminate: () => Promise<void>;
}

export interface TransactionMethods {
  /**
   * Initializes a transaction.
   *
   * @returns A promise that resolves with the result of the SQL query or an array of results for multiple queries.
   * @throws DatabaseError - If there is  an error occurs during execution.
   * @throws TransactionError - If the transaction initialization fails.
   */
  init: () => Promise<void>;
  /**
   * Performs a transaction query, executes the provided SQL queries with parameters.
   *
   * @param sql - The SQL query or an array of SQL queries to execute.
   * @param params - The parameters for the SQL query or an array of parameters for multiple queries.
   * @returns A promise that resolves with the result of the SQL query or an array of results for multiple queries.
   * @throws DatabaseError - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
   * @throws TransactionError - If the transaction initialization fails.
   */
  query: (sql: string | string[], params?: any | any[]) => Promise<any | any[]>;
  /**
   * Commits the current transaction.
   *
   * @returns A promise that resolves when the transaction is committed.
   * @throws TransactionError - If the transaction commit fails.
   */
  commit: () => Promise<void>;
  /**
   * Rolls back the current transaction.
   *
   * @returns A promise that resolves when the transaction is rolled back.
   * @throws TransactionError - If the transaction rollback fails.
   */
  rollback: () => Promise<void>;
  /**
   * Built-in method to generate a reference number. This generates a reference number by concatenating a UUID and the current timestamp in the system's default timezone.
   * @returns The generated reference number combining a UUID and the current timestamp.
   */
  generateRefNo: () => string;
  /**
   * Retrieves the database object and additional connection status.
   *
   * @returns An object containing the connection status and other properties from the database object.
   */
  retrieve: () => { connection: string; [key: string]: any };
}
