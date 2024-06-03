import { getDbObject, updateDbObject } from "./object";
import { TransactionError, DatabaseError } from "../errors/error";
import { manageDeadlocks } from "./deadlock";
import { TransactionMethods } from "../types";
import { TralseRequest } from "../types";

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
        const { connection } = getDbObject(req);

        await connection.beginTransaction();

        let queryResult;
        if (Array.isArray(sql)) {
          if (!Array.isArray(params) || sql.length !== params.length) {
            throw new DatabaseError("Mismatched SQL queries and parameters.");
          }
          queryResult = [];
          for (let i = 0; i < sql.length; i++) {
            const [rows] = await connection.execute(sql[i], params[i]);
            queryResult.push(rows);
          }
        } else {
          const [rows] = await connection.execute(sql, params);
          queryResult = rows;
        }
        const referenceNo = generateReferenceNo
          ? generateReferenceNo()
          : "refNo";
        const transactionData = {
          referenceNo,
        };

        updateDbObject(req, transactionData);
        return queryResult;
      } catch (error: any) {
        await rollbackTransaction();
        throw new TransactionError(
          `Failed to initialize transaction: ${error.message}`
        );
      }
    };

    /**
     * Commits the current transaction.
     *
     * @returns A promise that resolves when the transaction is committed.
     * @throws TransactionError - If the transaction commit fails.
     */
    const commitTransaction = async (): Promise<void> => {
      const { connection, referenceNo } = getDbObject(req);

      try {
        await connection.commit();
      } catch (error: any) {
        await rollbackTransaction();
        throw new TransactionError(
          `Failed to commit transaction: ${error.message}`
        );
      }
    };

    /**
     * Rolls back the current transaction.
     *
     * @returns A promise that resolves when the transaction is rolled back.
     * @throws TransactionError - If the transaction rollback fails.
     */
    const rollbackTransaction = async (): Promise<void> => {
      const { connection, referenceNo } = getDbObject(req);

      try {
        await connection.rollback();
      } catch (error: any) {
        throw new TransactionError(
          `Failed to rollback transaction: ${error.message}`
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
      try {
        dbObject = getDbObject(req);
        return { ...dbObject, connection: "initialized" };
      } catch (error: any) {
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
