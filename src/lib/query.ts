import { manageDeadlocks } from "./deadlock";
import { DatabaseError } from "../errors/error";
import { ExecuteDbQueryOptions } from "../types";
import { log, LogState } from "@tralse/developer-logs";
import mysql from "mysql2/promise";

/**
 * Executes a database query with deadlock management.
 *
 * @remarks
 * This function allows executing database queries with deadlock management. It supports both individual and parallel asynchronous execution.
 *
 * @param client - The MySQL connection.
 * @param sql - The SQL query or queries to execute.
 * @param params - The parameters for the SQL query or queries.
 * @param options - Optional settings for configuring query execution behavior.
 * @returns The result of the query or queries.
 * @throws DatabaseError - If query execution fails.
 *
 * @example
 * ```javascript
 * import mysql from "mysql2/promise";
 * import { executeDbQuery } from "@tralse/mysql-middleware";
 *
 * const pool = mysql.createPool({
 *    host: "host",
 *    user: "username",
 *    password: "password",
 *    database: "db",
 *    connectionLimit: 10,
 *    waitForConnections: true,
 *    port: 3306,
 * });
 *
 * // For individual execution
 * const getUser = async () => {
 *    const connection = await pool.getConnection();
 *    const sql = `SELECT * FROM schema.users WHERE id = ?`;
 *    const params = [userId];
 *
 *    try{
 *        const [rows] = await executeDbQuery(connection, sql, params);
 *        return rows;
 *    } catch(error){
 *        res.status(500).send(error.message);
 *    } finally {
 *        connection.release();
 *    }
 * }
 *
 * // For parallel execution
 * const getUserParallel = async () => {
 *    const connection = await pool.getConnection();
 *    const sql = [`SELECT * FROM schema.user_books WHERE id = ?`, `SELECT * FROM schema.users WHERE id = ?`];
 *    const params = [[userId], [userId]];
 *    const options = { parallel: true };
 *
 *    try{
 *        // Executes all queries using Promise.all, running them simultaneously.
 *        // Remember when using this, no query must be dependent on each other.
 *        const result = await executeDbQuery(connection, sql, params, options);
 *
 *        // Extract rows
 *        const rows = result.map((res) => res[0]);
 *
 *        res.send(rows);
 *    } catch(error){
 *        res.status(500).send(error.message);
 *    } finally {
 *        connection.release();
 *    }
 * }
 * ```
 */
export const executeDbQuery = async (
  client: mysql.PoolConnection,
  sql: string | string[],
  params: any[] | any[][] = [],
  options?: ExecuteDbQueryOptions
): Promise<
  | [mysql.QueryResult, mysql.FieldPacket[]]
  | [mysql.QueryResult, mysql.FieldPacket[]][]
> => {
  return await manageDeadlocks(3, async () => {
    try {
      log.magenta(`Attempting query...`, "executeDbQuery", LogState.DEBUGMODE);

      if (!client)
        throw new DatabaseError(
          "Couldn't find a client connection. Make sure that you have initialized the client connection before proceeding to this method."
        );

      let queryResult:
        | [mysql.QueryResult, mysql.FieldPacket[]]
        | [mysql.QueryResult, mysql.FieldPacket[]][] = [];

      if (Array.isArray(sql)) {
        if (!Array.isArray(params) || sql.length !== params.length) {
          throw new DatabaseError("Mismatched SQL queries and parameters.");
        }

        if (options?.parallel) {
          // Execute all queries in parallel
          const promises = sql.map((query, index) =>
            client.query(query, params[index])
          );
          queryResult = await Promise.all(promises);
        } else {
          // Execute queries sequentially
          for (let i = 0; i < sql.length; i++) {
            const result = await client.query(sql[i], params[i]);
            queryResult.push(result);
          }
        }
      } else {
        const result = await client.query(sql, params);
        queryResult = result;
      }

      log.green(
        "Success. Query executed",
        "executeDbQuery",
        LogState.DEBUGMODE
      );
      return queryResult;
    } catch (error: any) {
      log.red("Force exit.", "executeDbQuery", LogState.DEBUGMODE);
      throw error;
    }
  });
};
