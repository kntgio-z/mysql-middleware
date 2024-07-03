import { TransactionError, DatabaseError } from "../errors/error";
import { ExecuteDbQueryOptions, TransactionMethods } from "../types";
import { log, LogState } from "@tralse/developer-logs";
import { executeDbQuery } from "./query";
import { generateRefNo as systemGenerateReferenceNo } from "../helpers/ref";
import mysql from "mysql2/promise";

/**
 * Initializes a transaction.
 *
 * @param client - The pool connection or client.
 * @returns The transaction methods.
 * @throws TransactionError - If there is an error initializing the transaction.
 */
export const initializeDbTransaction = async (
  client: mysql.PoolConnection
): Promise<TransactionMethods> => {
  let uuid: string;
  let timestamp: string;

  /**
   * Initializes a transaction.
   *
   * @returns A promise.
   * @throws DatabaseError - If there is an error during execution.
   * @throws TransactionError - If the transaction initialization fails.
   */
  const init = async (): Promise<void> => {
    try {
      log.magenta(`Initializing transaction...`, "init", LogState.DEBUGMODE);
      if (!client)
        throw new DatabaseError(
          "Couldn't find a client connection. Make sure that you have initialized the client connection before proceeding to this method."
        );

      await client.beginTransaction();

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
   * @param options - Optional settings for configuring query execution behavior.
   * @returns A promise that resolves with the result of the SQL query or an array of results for multiple queries.
   * @throws DatabaseError - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
   * @throws TransactionError - If the transaction initialization fails.
   */
  const query = async (
    sql: string | string[],
    params: any[] | any[][] = [],
    options?: ExecuteDbQueryOptions
  ): Promise<| [mysql.QueryResult, mysql.FieldPacket[]]
  | [mysql.QueryResult, mysql.FieldPacket[]][]> => {
    try {
      log.magenta(
        `Executing transaction query...`,
        "query",
        LogState.DEBUGMODE
      );

      let queryResult = await executeDbQuery(client, sql, params, options);

      const ref = systemGenerateReferenceNo();
      timestamp = ref.timestamp;
      uuid = ref.uuid;

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
          `Failed to execute transaction query: ${(error.message, error.code)}`
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
      log.magenta(`Committing transaction...`, "commit", LogState.DEBUGMODE);
      if (!client)
        throw new DatabaseError(
          "Couldn't find a client connection. Make sure that you have initialized the client connection before proceeding to this method."
        );

      await client.commit();
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
   */
  const rollback = async (): Promise<void> => {
    if (client) {
      log.magenta(`Rolling back transaction...`, "rollback", LogState.DEBUGMODE);
      await client.rollback();
      log.green(
        `Done. Transaction rollback success.`,
        "rollback",
        LogState.DEBUGMODE
      );
    } else {
      log.green(
        `Done. No connection initiated. Exiting...`,
        "rollback",
        LogState.DEBUGMODE
      );
    }
  };

  /**
   * Retrieves the database object and additional connection status.
   *
   * @returns An object containing the connection status and other properties from the database object.
   */
  const retrieve = () => ({
    connection: !!client,
    referenceNo: uuid,
    timestamp,
  });

  return {
    init,
    query,
    commit,
    rollback,
    retrieve,
  };
};
