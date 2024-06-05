import {
  getDbObject,
  serializeConnection,
  dispatchDbObject,
} from "./lib/object";
import { executeDbQuery } from "./lib/query";
import { DatabaseError } from "./errors/error";
import { initializeDbTransaction } from "./lib/transactions";
import { Pool } from "mysql2/promise";
import {
  DatabaseInstance,
  TransactionMethods,
  TralseRequest,
  TralseResponse,
  TralseNext,
} from "./types";

/**
 * Initializes the database and provides query and transaction methods.
 *
 * @param req - The request object.
 * @param pool - The database connection pool.
 * @param dbName - The name of the database.
 * @param enableTransactions - Whether to enable transaction support.
 * @returns The initialized database object.
 * @throws DatabaseError - If there is an error initializing the database.
 */
const initializeDatabase = async (
  req: TralseRequest,
  pool: Pool,
  dbName: string,
  enableTransactions: boolean
): Promise<DatabaseInstance> => {
  /**
   * Initializes a mysql connection and serializes it into the request.
   *
   * @returns A promise that resolves when the connection is initialized.
   * @throws DatabaseError - If there is an error initializing the database connection.
   */
  const initializeConnection = async (): Promise<void> => {
    try {
      const connection = await pool.getConnection();
      serializeConnection(req, connection);
    } catch (error: any) {
      throw new DatabaseError(`Error initializing database. ${error}`);
    }
  };

  /**
   * Executes a database query.
   *
   * @param sql - The SQL query string to execute.
   * @param params - The parameters for the SQL query.
   * @returns A promise that resolves with the query result.
   * @throws DatabaseError - If there is an error executing the query.
   */
  const query = async (sql: string, params: any[] = []): Promise<any> => {
    return await executeDbQuery(req, dbName, sql, params);
  };

  /**
   * Begins a database transaction with the specified isolation level.
   *
   * @param isolationLevel - The isolation level for the transaction. Defaults to "READ COMMITTED".
   * @returns A promise that resolves with the transaction methods.
   * @throws DatabaseError - If there is an error initializing the transaction.
   */
  const transaction = async (
    isolationLevel: string = "READ COMMITTED"
  ): Promise<TransactionMethods> => {
    return await initializeDbTransaction(req, dbName, isolationLevel);
  };

  /**
   * Releases the current mysql connection.
   *
   * @returns A promise that resolves when the connection is released.
   * @throws DatabaseError - If there is an error releasing the connection.
   */
  const releaseConnection = async (): Promise<void> => {
    try {
      const dbObject = getDbObject(req);

      if (!dbObject || !dbObject.connection)
        throw new Error("Connection is undefined.");
      dispatchDbObject(req);
      dbObject.connection.release();
    } catch (error: any) {
      console.log(error.code);
      if (error.code === "CONN_NOT_INIT") return;
      else throw new DatabaseError(error.message, error.code);
    }
  };

  /**
   * Terminates the mysql connection pool.
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
 * @param enableTransactions - Whether to enable transaction support.
 * @returns The middleware function.
 */
export const TralseMySQL = (
  pool: Pool,
  dbName: string,
  enableTransactions: boolean = false
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
        dbName,
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
export const getMysql = (
  req: TralseRequest,
  name: string
): DatabaseInstance => {
  if (!req.tralse_db_mysql[name])
    throw new DatabaseError(`Cannot find a database named ${name}.`);

  return req.tralse_db_mysql[name];
};

export * from "./types/index";
export { executeDbQuery2 as executeDbQuery } from "./lib/query";
