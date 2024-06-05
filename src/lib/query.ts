import { manageDeadlocks } from "./deadlock";
import { DatabaseError } from "../errors/error";
import { getDbObject } from "./object";
import { Connection, QueryResult } from "mysql2/promise";
import { ExecuteDbQueryOptions, TralseRequest } from "../types";
import { log, LogState } from "@tralse/developer-logs";


export const executeDbQuery: {
  /**
   * Executes a database query with deadlock management.
   *
   * @remarks
   * Compatible only for middleware and TralseMySql must be used. This function allows executing database queries with deadlock management. It supports both individual and parallel asynchronous execution.
   *
   * @param req - The request object.
   * @param dbName - The name of the database connection.
   * @param sql - The SQL query or queries to execute.
   * @param params - The parameters for the SQL query or queries.
   * @param options - Optional settings for configuring query execution behavior.
   * @returns The result of the query or queries.
   * @throws DatabaseError - If query execution fails.
   *
   * @example
   * ```javascript
   * import { TralseMySQL, getMysql } from "@tralse/mysql-middleware";
   * import mysql from "mysql2/promise";
   * import session from "express-session";
   * import express from "express";
   *
   * const pool = mysql.createPool({
   * // Database connection details
   *    host: "host",
   *    user: "username",
   *    password: "password",
   *    database: "db",
   *    connectionLimit: 10,
   *    port: 3306,
   *    waitForConnections: true,
   * });
   *
   * const app = express();
   *
   * // Configure the Express application to use the session middleware
   * app.use(
   *    session({
   *        secret: "your_secret_key", // Secret key used for signing session IDs
   *        resave: false, // Do not save the session on every request
   *        saveUninitialized: true, // Save uninitialized sessions
   *        cookie: { secure: false }, // Set the session cookie as non-secure (can be sent over HTTP)
   *    })
   * );
   *
   * // Use the TralseMySQL middleware to handle MySQL connections and transactions
   * app.use(TralseMySQL(pool, "sample", true));
   *
   * // For individual execution
   * app.get("/user", async (req, res) => {
   *    const { initializeConnection, query, releaseConnection } = getMysql(
   *        req,
   *        "sample"
   *    );
   *
   *    const dbName = "sample_db";
   *    const sql = "SELECT * FROM users WHERE id = ?";
   *    const params = [userId];
   *
   *    try{
   *        // Acquire a connection from the pool
   *        await initializeConnection();
   *
   *        const result = await query(req, dbName, sql, params);
   *        res.send(result);
   *    } catch(error){
   *        res.status(500).send(error.message);
   *    } finally {
   *        // Release the connection back to the pool
   *        await releaseConnection();
   *    }
   * })
   *
   * // For parallel execution
   * app.get("/user/parallel", async (req, res) => {
   *    const { initializeConnection, query, releaseConnection } = getMysql(
   *        req,
   *        "sample"
   *    );
   *
   *    const dbName = "sample_db";
   *    const sql = ["SELECT * FROM user_books WHERE id = ?", "SELECT * FROM users WHERE id = ?"];
   *    const params = [[userId], [userId]];
   *    const options = { parallel: true };
   *
   *    try{
   *        // Acquire a connection from the pool
   *        await initializeConnection();
   *
   *        // Executes all query using Promise.all, running them simultaneously.
   *        // Remember when using this, no query must be dependent to each other.
   *        const result = await query(req, dbName, sql, params, options);
   *        res.send(result);
   *    } catch(error){
   *        res.status(500).send(error.message);
   *    } finally {
   *        // Release the connection back to the pool
   *        await releaseConnection();
   *    }
   * })
   *
   * app.listen(3000, () => {
   *    console.log(`Server is running in port 3000.`);
   * })
   * ```
   */
  (
    req: TralseRequest,
    dbName: string,
    sql: string | string[],
    params?: any[] | any[][],
    options?: ExecuteDbQueryOptions
  ): Promise<QueryResult | QueryResult[]>;
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
  (
    conn: Connection,
    dbName: string,
    sql: string | string[],
    params?: any[] | any[][],
    options?: ExecuteDbQueryOptions
  ): Promise<QueryResult | QueryResult[]>;
} = async (
  arg1: TralseRequest | Connection,
  dbName: string,
  sql: string | string[],
  params: any[] | any[][] = [],
  options?: ExecuteDbQueryOptions
): Promise<QueryResult | QueryResult[]> => {
  return await manageDeadlocks(3, async () => {
    try {
      log.magenta(`Attempting query...`, "executeDbQuery", LogState.DEBUGMODE);

      let connection: Connection;
      if ("execute" in arg1) {
        connection = arg1 as Connection;
      } else {
        const result = getDbObject(arg1 as TralseRequest);
        if (!result) {
          throw new Error("Cannot get connection.");
        }
        connection = result.connection;
      }

      let queryResult;
      if (Array.isArray(sql)) {
        if (!Array.isArray(params) || sql.length !== params.length) {
          throw new DatabaseError("Mismatched SQL queries and parameters.");
        }
        queryResult = [];
        if (options && options.parallel) {
          // Executes queries individually
          for (let i = 0; i < sql.length; i++) {
            const [rows] = await connection.execute(sql[i], params[i]);
            queryResult.push(rows);
          }
        } else {
          // Execute all queries in parallel
          const promises = sql.map((query, index) => {
            return connection.execute(query, params[index]);
          });
          const resultsArray = await Promise.all(promises);
          queryResult = resultsArray.map(([rows]) => rows);
        }
      } else {
        const [rows] = await connection.execute(sql, params);
        queryResult = rows;
      }
      log.green("Success. Query executed", "executeDbQuery", LogState.DEBUGMODE);

      return queryResult;
    } catch (error: any) {
      log.red("Force exit.", "executeDbQuery", LogState.DEBUGMODE);
      throw error;
    }
  });
};