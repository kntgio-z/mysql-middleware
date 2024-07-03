import { executeDbQuery } from "./lib/query";
import { DatabaseError } from "./errors/error";
import { initializeDbTransaction } from "./lib/transactions";
import mysql from "mysql2/promise";
import {
  DatabaseInstance,
  TransactionMethods,
  TralseRequest,
  TralseResponse,
  TralseNext,
  ExecuteDbQueryOptions,
} from "./types";

/**
 * Initializes the database and provides query and transaction methods.
 *
 * @param req - The request object.
 * @param pool - The database connection pool.
 * @param enableTransactions - Whether to enable transaction support.
 * @returns The initialized database object.
 * @throws DatabaseError - If there is an error initializing the database.
 */
const initializeDatabase = async (
  req: TralseRequest,
  pool: mysql.Pool,
  enableTransactions: boolean
): Promise<DatabaseInstance> => {
  let client: mysql.PoolConnection;

  /**
   * Initializes a MySQL connection and serializes it into the request.
   *
   * @returns A promise that resolves when the connection is initialized.
   * @throws DatabaseError - If there is an error initializing the database connection.
   */
  const initializeConnection = async (): Promise<void> => {
    try {
      client = await pool.getConnection();
    } catch (error: any) {
      throw new DatabaseError(`Error initializing database. ${error}`);
    }
  };

  /**
   * Executes a database query.
   *
   * @param sql - The SQL query string to execute.
   * @param params - The parameters for the SQL query.
   * @param options - Optional settings for configuring query execution behavior.
   * @returns A promise that resolves with the query result.
   * @throws DatabaseError - If there is an error executing the query.
   */
  const query = async (
    sql: string,
    params: any[] = [],
    options?: ExecuteDbQueryOptions
  ): Promise<| [mysql.QueryResult, mysql.FieldPacket[]]
  | [mysql.QueryResult, mysql.FieldPacket[]][]> => {
    return await executeDbQuery(client, sql, params, options);
  };

  /**
   * Begins a database transaction.
   *
   * @returns A promise that resolves with the transaction methods.
   * @throws DatabaseError - If there is an error initializing the transaction.
   */
  const transaction = async (): Promise<TransactionMethods> => {
    return await initializeDbTransaction(client);
  };

  /**
   * Releases the current MySQL connection.
   *
   * @returns A promise that resolves when the connection is released.
   * @throws DatabaseError - If there is an error releasing the connection.
   */
  const releaseConnection = async (): Promise<void> => {
    try {
      if (!client)
        throw new DatabaseError(
          "Couldn't find a client connection. Make sure that you have initialized the client connection before proceeding to this method."
        );
      client.release();
    } catch (error: any) {
      console.log(error);

      if (error.code === "CONN_NOT_INIT") return;
      else throw new DatabaseError(error.message, error.code);
    }
  };

  /**
   * Terminates the MySQL connection pool.
   *
   * @returns A promise that resolves when the connection pool is terminated.
   * @throws DatabaseError - If there is an error terminating the connection pool.
   */
  const terminate = async (): Promise<void> => {
    if (pool) {
      try {
        await pool.end();
      } catch (error: any) {
        throw new DatabaseError(
          `Failed to terminate database connection pool: ${
            (error.message, error.code)
          }`
        );
      }
    }
  };

  return enableTransactions
    ? { initializeConnection, query, transaction, releaseConnection, terminate }
    : { initializeConnection, query, releaseConnection, terminate };
};

/**
 * Middleware to attach TralseMySQL to requests.
 *
 * @param pool - The database connection pool.
 * @param dbName - The name of the database.
 * @param enableTransactions - Whether to enable transaction support. Default value is true.
 * @returns The middleware function.
 */
export const TralseMySQL = (
  pool: mysql.Pool,
  dbName: string,
  enableTransactions: boolean = true
) => {
  return async (
    req: TralseRequest,
    res: TralseResponse,
    next: TralseNext
  ): Promise<void> => {
    try {
      req.tralse_db_mysql = req.tralse_db_mysql || {};
      const dbInstance = await initializeDatabase(
        req,
        pool,
        enableTransactions
      );
      req.tralse_db_mysql[dbName] = dbInstance;

      next();
    } catch (error: any) {
      res.status(500).json({
        status: 500,
        code: "DATABASE_INIT_ERROR",
        error: "Error initializing database.",
      });
    }
  };
};

/**
 * Retrieves a MySQL database instance from the TralseRequest object.
 *
 * @param req - The TralseRequest object containing database instances.
 * @param name - The name of the MySQL database instance to retrieve.
 * @returns The MySQL database instance.
 * @throws If the specified database instance is not found.
 */
export const getMySQL = (
  req: TralseRequest,
  name: string
): DatabaseInstance => {
  if (!req.tralse_db_mysql[name])
    throw new DatabaseError(`Cannot find a database named ${name}.`);

  return req.tralse_db_mysql[name];
};

/**
 * Extracts rows from a MySQL query result or an array of query results.
 * @param result - The result object or array of result objects from a MySQL query.
 * @returns An array of rows extracted from the query results. If `result` is an array,
 * returns an array where each element corresponds to the rows of each query result.
 */
export const extractRows = (
  result:
    | [mysql.QueryResult, mysql.FieldPacket[]]
    | [mysql.QueryResult, mysql.FieldPacket[]][]
): any[] => {
  if (Array.isArray(result)) {
    return (result as [mysql.QueryResult, mysql.FieldPacket[]][]).map(
      (res) => res[0]
    );
  } else {
    throw new DatabaseError(
      `Expected result to be an array of [QueryResult, FieldPacket[]] tuples, but received ${typeof result}.`
    );
  }
};

export * from "./types/index";
export { executeDbQuery };
