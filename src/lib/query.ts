import { manageDeadlocks } from "./deadlock";
import { DatabaseError } from "../errors/error";
import { getDbObject } from "./object";
import { RowDataPacket } from "mysql2/promise";
import { TralseRequest } from "../types";
import { log, LogState } from "@tralse/developer-logs";

type QueryResult = RowDataPacket[];

/**
 * Executes a database query with deadlock management.
 *
 * @param req - The request object.
 * @param dbName - The name of the database connection.
 * @param sql - The SQL query or queries to execute.
 * @param params - The parameters for the SQL query or queries.
 * @returns The result of the query or queries.
 * @throws DatabaseError - If query execution fails.
 */
export const executeDbQuery = async (
  req: TralseRequest,
  dbName: string,
  sql: string | string[],
  params: any[] | any[][] = []
): Promise<QueryResult | QueryResult[]> => {
  return await manageDeadlocks(3, async () => {
    try {
      const result = getDbObject(req);
      if (result) {
        log.magenta(
          `Attempting query...`,
          "executeDbQuery",
          LogState.DEBUGMODE
        );

        let queryResult;
        if (Array.isArray(sql)) {
          if (!Array.isArray(params) || sql.length !== params.length) {
            throw new DatabaseError("Mismatched SQL queries and parameters.");
          }
          queryResult = [];
          for (let i = 0; i < sql.length; i++) {
            const [rows] = await result.connection.execute(sql[i], params[i]);
            queryResult.push(rows);
          }
        } else {
          const [rows] = await connection.execute(sql, params);
          queryResult = rows;
        }
        log.green("Success. Query executed", "executeDbQuery");

        return queryResult;
      } else throw new Error("Cannot get connection.");
    } catch (error: any) {
      log.red("Force exit.", "executeDbQuery");
      throw new DatabaseError(`Query execution failed: ${error.message}`);
    }
  });
};
