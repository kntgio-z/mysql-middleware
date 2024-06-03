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
  const initializeConnection = async (): Promise<void> => {
    try {
      const connection = await pool.getConnection();
      serializeConnection(req, connection);
    } catch (error) {
      console.log(error);
      throw new DatabaseError(`Error initializing database.${error}`);
    }
  };

  const query = async (sql: string, params: any[] = []): Promise<any> => {
    return await executeDbQuery(req, dbName, sql, params);
  };

  const transaction = async (
    isolationLevel: string = "READ COMMITTED"
  ): Promise<TransactionMethods> => {
    return await initializeDbTransaction(req, dbName, isolationLevel);
  };

  const releaseConnection = async (): Promise<void> => {
    const { connection } = getDbObject(req);
    dispatchDbObject(req);
    await connection.end();
  };

  const terminate = async (): Promise<void> => {
    if (pool) {
      try {
        await pool.end();
      } catch (error: any) {
        throw new DatabaseError(
          `Failed to terminate database connection pool: ${error.message}`
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
  return async (req: TralseRequest, res: TralseResponse, next: TralseNext): Promise<void> => {
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

export * from "./types/index";
