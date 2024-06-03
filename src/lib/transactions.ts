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
