import {
  getDbObject,
  serializeConnection,
  dispatchDbObject,
} from "./lib/object";
import { executeDbQuery } from "./lib/query";
import { DatabaseError } from "./errors/error";
import { initializeDbTransaction } from "./lib/transactions";
import { Connection, Pool, QueryResult } from "mysql2/promise";
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
   * @param options - Optional settings for configuring query execution behavior.
   * @returns A promise that resolves with the query result.
   * @throws DatabaseError - If there is an error executing the query.
   */
  const query = async (
    sql: string,
    params: any[] = [],
    options?: ExecuteDbQueryOptions
  ): Promise<any> => {
    return await executeDbQuery(req, dbName, sql, params, options);
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

/**
 * Executes a database query with deadlock management.
 *
 * @remarks
 * This function allows executing database queries with deadlock management. It supports both individual and parallel asynchronous execution.
 *
 * @param conn - The MySQL connection.
 * @param dbName - The name of the database connection.
 * @param sql - The SQL query or queries to execute.
 * @param params - The parameters for the SQL query or queries.
 * @param options - Optional settings for configuring query execution behavior.
 * @returns The result of the query or queries.
 * @throws DatabaseError - If query execution fails.
 *
 * @example
 * ```javascript
 * import { executeDbQuery } from "@tralse/mysql-middleware";
 *
 * const pool = mysql.createPool({
 *    // Database connection details
 *    host: "host",
 *    user: "username",
 *    password: "password",
 *    database: "db",
 *    connectionLimit: 10,
 *    port: 3306,
 *    waitForConnections: true,
 * });
 *
 *
 * // For individual execution
 * const getUser = async () => {
 *    const connection = await pool.getConnection();
 *    const dbName = "sample_db";
 *    const sql = "SELECT * FROM users WHERE id = ?";
 *    const params = [userId];
 *
 *    try{
 *        const result = await executeDbQuery(connection, dbName, sql, params);
 *        return result;
 *    } catch(error){
 *        res.status(500).send(error.message);
 *    } finally {
 *      await connection.release();
 *    }
 * }
 *
 * // For parallel execution
 * const getUserParallel = async () => {
 *    const connection = await pool.getConnection();
 *    const dbName = "sample_db";
 *    const sql = ["SELECT * FROM user_books WHERE id = ?", "SELECT * FROM users WHERE id = ?"];
 *    const params = [[userId], [userId]];
 *    const options = { parallel: true };
 *
 *    try{
 *        // Executes all query using Promise.all, running them simultaneously.
 *        // Remember when using this, no query must be dependent to each other.
 *        const result = await executeDbQuery(connection, dbName, sql, params, options);
 *        res.send(result);
 *    } catch(error){
 *        res.status(500).send(error.message);
 *    } finally {
 *      await connection.release();
 *    }
 * }
 *
 * ```
 */
const executeQueryConn = async (
  conn: Connection,
  dbName: string,
  sql: string | string[],
  params?: any[] | any[][],
  options?: ExecuteDbQueryOptions
): Promise<QueryResult | QueryResult[]> => {
  return await executeDbQuery(conn, dbName, sql, params, options);
};

export * from "./types/index";
export { executeQueryConn as executeDbQuery };
