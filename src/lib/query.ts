import { manageDeadlocks } from "./deadlock";
import { DatabaseError } from "../errors/error";
import { getDbObject } from "./object";
import { RowDataPacket } from "mysql2/promise";
import { TralseRequest } from "../types";

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
    const { connection } = getDbObject(req);

    try {
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
      return queryResult;
    } catch (error: any) {
      throw new DatabaseError(`Query execution failed: ${error.message}`);
    }
  });
};
