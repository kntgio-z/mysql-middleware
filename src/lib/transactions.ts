import { getDbObject, updateDbObject } from "./object";
import { TransactionError, DatabaseError } from "../errors/error";
import { TransactionMethods } from "../types";
import { TralseRequest } from "../types";
import { log, LogState } from "@tralse/developer-logs";
import { executeDbQuery } from "./query";
import {
  generateRefNo,
  generateRefNo as systemGenerateReferenceNo,
} from "../helpers/ref";
import { QueryResult } from "mysql2/promise";
/**
 * Initializes a transaction.
 *
 * @param req - The request object.
 * @returns The transaction methods.
 * @throws TransactionError - If there is an error initializing the transaction.
 */
export const initializeDbTransaction = async (
  req: TralseRequest
): Promise<TransactionMethods> => {
  /**
   * Initializes a transaction.
   *
   * @returns A promise that resolves with the result of the SQL query or an array of results for multiple queries.
   * @throws DatabaseError - If there is  an error occurs during execution.
   * @throws TransactionError - If the transaction initialization fails.
   */
  const init = async (): Promise<void> => {
    try {
      log.magenta(`Initializing transaction...`, "init", LogState.DEBUGMODE);

      const dbObject = getDbObject(req);

      if (!dbObject || !dbObject.connection) {
        throw new DatabaseError("Database object or connection is undefined.");
      }

      const { connection } = dbObject;

      await connection.beginTransaction();

      log.green(
        `Done. Transaction initialization success.`,
        "init",
        LogState.DEBUGMODE
      );
    } catch (error: any) {
      log.red(`Force exit. Exiting transaction...`, "init", LogState.DEBUGMODE);
      if (error instanceof DatabaseError || error instanceof TransactionError)
        throw new TransactionError(
          `Failed to initialize transaction: ${(error.message, error.code)}`
        );
      else throw error;
    }
  };

  /**
   * Performs a transaction query, executes the provided SQL queries with parameters.
   *
   * @param sql - The SQL query or an array of SQL queries to execute.
   * @param params - The parameters for the SQL query or an array of parameters for multiple queries.
   * @returns A promise that resolves with the result of the SQL query or an array of results for multiple queries.
   * @throws DatabaseError - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
   * @throws TransactionError - If the transaction initialization fails.
   */
  const query = async (
    sql: string | string[],
    params: any | any[] = []
  ): Promise<QueryResult | QueryResult[]> => {
    try {
      log.magenta(
        `Executing transaction query...`,
        "query",
        LogState.DEBUGMODE
      );

      const dbObject = getDbObject(req);

      if (!dbObject || !dbObject.connection) {
        throw new DatabaseError("Database object or connection is undefined.");
      }

      const { connection } = dbObject;

      let queryResult = await executeDbQuery(connection, sql, params);

      const { uuid, timestamp } = systemGenerateReferenceNo();
      updateDbObject(req, { referenceNo: uuid, timestamp });

      log.green(
        `Done. Transaction query execution success.`,
        "query",
        LogState.DEBUGMODE
      );

      return queryResult;
    } catch (error: any) {
      log.red(
        `Force exit. Exiting transaction...`,
        "query",
        LogState.DEBUGMODE
      );
      if (error instanceof DatabaseError || error instanceof TransactionError)
        throw new TransactionError(
          `Failed to initialize transaction: ${(error.message, error.code)}`
        );
      else throw error;
    }
  };

  /**
   * Commits the current transaction.
   *
   * @returns A promise that resolves when the transaction is committed.
   * @throws TransactionError - If the transaction commit fails.
   */
  const commit = async (): Promise<void> => {
    try {
      const dbObject = getDbObject(req);
      if (!dbObject || !dbObject.connection) {
        throw new DatabaseError("Database object or connection is undefined.");
      }
      log.magenta(`Committing transaction...`, "commit", LogState.DEBUGMODE);
      await dbObject.connection.commit();
      log.green(`Done. Commit success.`, "commit", LogState.DEBUGMODE);
    } catch (error: any) {
      log.red(
        `Force exit. Exiting transaction...`,
        "commit",
        LogState.DEBUGMODE
      );
      if (error.code !== "CONN_NOT_INIT") {
        throw new TransactionError(
          `Failed to commit transaction: ${(error.message, error.code)}`
        );
      } else {
        throw new TransactionError(error.message, error.code);
      }
    }
  };

  /**
   * Rolls back the current transaction.
   *
   * @returns A promise that resolves when the transaction is rolled back.
   * @throws TransactionError - If the transaction rollback fails.
   */
  const rollback = async (): Promise<void> => {
    try {
      const dbObject = getDbObject(req);

      if (!dbObject || !dbObject.connection || !dbObject.referenceNo) {
        throw new DatabaseError("Database object or connection is undefined.");
      }
      log.magenta(`Rollbacking transaction...`, "rollback", LogState.DEBUGMODE);
      await dbObject.connection.rollback();
      log.green(
        `Done. Transaction rollback success.`,
        "rollback",
        LogState.DEBUGMODE
      );
    } catch (error: any) {
      log.red(
        `Force exit. Exiting transaction...`,
        "rollback",
        LogState.DEBUGMODE
      );
      throw new TransactionError(
        `Failed to rollback transaction: ${(error.message, error.code)}`,
        error.code
      );
    }
  };

  /**
   * Retrieves the database object and additional connection status.
   *
   * @returns An object containing the connection status and other properties from the database object.
   */
  const retrieve = () => {
    let dbObject;

    log.magenta(`Retrieving records...`, "retrieve", LogState.DEBUGMODE);

    try {
      dbObject = getDbObject(req);
      log.green(
        `Done. Connection is initialized`,
        "retrieve",
        LogState.DEBUGMODE
      );

      if (dbObject) {
        const { timeoutId, ...newDbObject } = dbObject;
        return {
          ...newDbObject,
          connection: !!newDbObject.connection,
        };
      } else {
        throw new Error("dbObject is null or undefined.");
      }
    } catch (error: any) {
      log.green(
        `Done. Connection is not initialized`,
        "retrieve",
        LogState.DEBUGMODE
      );
      throw error;
    }
  };

  return {
    init,
    query,
    commit,
    rollback,
    retrieve,
  };
};
