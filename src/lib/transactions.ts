import { getDbObject, updateDbObject } from "./object";
import { TransactionError, DatabaseError } from "../errors/error";
import { manageDeadlocks } from "./deadlock";
import { TransactionMethods } from "../types";
import { TralseRequest } from "../types";
import { log, LogState } from "@tralse/developer-logs";
import { executeDbQuery2 } from "./query";

/**
 * Initializes a transaction.
 *
 * @param req - The request object.
 * @param dbName - The name of the database connection.
 * @param isolationLevel - The transaction isolation level.
 * @returns The transaction methods.
 * @throws TransactionError - If there is an error initializing the transaction.
 */
export const initializeDbTransaction = async (
  req: TralseRequest,
  dbName: string,
  isolationLevel: string = "READ COMMITTED"
): Promise<TransactionMethods> => {
  return await manageDeadlocks(3, async () => {
    /**
     * Initializes a transaction, executes the provided SQL queries with parameters, and generates a reference number.
     *
     * @param sql - The SQL query or an array of SQL queries to execute.
     * @param params - The parameters for the SQL query or an array of parameters for multiple queries.
     * @param generateReferenceNo - An optional function to generate a reference number for the transaction.
     * @returns A promise that resolves with the result of the SQL query or an array of results for multiple queries.
     * @throws DatabaseError - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
     * @throws TransactionError - If the transaction initialization fails.
     */
    const initTransaction = async (
      sql: string | string[],
      params: any | any[] = [],
      generateReferenceNo: (() => string) | null = null
    ): Promise<any | any[]> => {
      try {
        log.magenta(
          `Initializing transaction...`,
          "initTransaction",
          LogState.DEBUGMODE
        );

        const dbObject = getDbObject(req);

        if (!dbObject || !dbObject.connection) {
          throw new DatabaseError(
            "Database object or connection is undefined."
          );
        }

        const { connection } = dbObject;

        await connection.beginTransaction();

        let queryResult = await executeDbQuery2(
          connection,
          dbName,
          sql,
          params
        );

        const referenceNo = generateReferenceNo
          ? generateReferenceNo()
          : "refNo";
        const transactionData = {
          referenceNo,
        };

        updateDbObject(req, transactionData);

        log.green(`Done. Transaction success.`, "initTransaction");
        return queryResult;
      } catch (error: any) {
        log.red(
          `Force exit. Rollbacking transaction...`,
          "initTransaction",
          LogState.DEBUGMODE
        );
        await rollbackTransaction();
        log.red(
          `Force exit. Transaction rollback done...`,
          "initTransaction",
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
    const commitTransaction = async (): Promise<void> => {
      try {
        const dbObject = getDbObject(req);
        if (!dbObject || !dbObject.connection || !dbObject.referenceNo) {
          throw new DatabaseError(
            "Database object or connection is undefined."
          );
        }
        log.magenta(
          `Committing transaction...`,
          "commitTransaction",
          LogState.DEBUGMODE
        );
        await dbObject.connection.commit();
        log.green(`Done. Commit success.`, "commitTransaction");
      } catch (error: any) {
        log.red(`Force exit. Rollbacking transaction...`, "initTransaction");
        if (error.code !== "CONN_NOT_INIT") {
          await rollbackTransaction();
          log.red(
            `Force exit. Transaction rollback done...`,
            "initTransaction"
          );
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
    const rollbackTransaction = async (): Promise<void> => {
      try {
        const dbObject = getDbObject(req);

        if (!dbObject || !dbObject.connection || !dbObject.referenceNo) {
          throw new DatabaseError(
            "Database object or connection is undefined."
          );
        }
        log.magenta(
          `Rollbacking transaction...`,
          "rollbackTransaction",
          LogState.DEBUGMODE
        );
        await dbObject.connection.rollback();
        log.green(`Done. Transaction rollback success.`, "rollbackTransaction");
      } catch (error: any) {
        log.red(`Force exit.`, "rollbackTransaction");
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
    const retrieveRecords = (): { connection: string; [key: string]: any } => {
      let dbObject;

      log.magenta(
        `Retrieving records...`,
        "retrieveRecords",
        LogState.DEBUGMODE
      );

      try {
        dbObject = getDbObject(req);
        log.green(`Done. Connection is initialized`, "retrieveRecords");
        return { ...dbObject, connection: "initialized" };
      } catch (error: any) {
        log.green(`Done. Connection is not initialized`, "retrieveRecords");
        return { connection: "not initialized", error: error.message };
      }
    };

    return {
      init: initTransaction,
      commit: commitTransaction,
      rollback: rollbackTransaction,
      retrieve: retrieveRecords,
    };
  });
};
