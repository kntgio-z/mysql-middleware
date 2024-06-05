import { DatabaseError } from "../errors/error";
import { DatabaseObject } from "../types";
import { TralseRequest } from "../types";
import { PoolConnection as Connection } from "mysql2/promise";
import { log, LogState } from "@tralse/developer-logs";

const TIMEOUT_WITHIN = 60000;

// Map to manage database connections
const connectionManager = new Map<string, DatabaseObject>();

/**
 * Checks if the session object is initialized in the request.
 *
 * @param req - The request object.
 * @throws DatabaseError - If the session object is not yet initialized.
 */
const checkSessionObject = (req: TralseRequest): void => {
  log.magenta(
    `Checking session object...`,
    "checkSessionObject",
    LogState.DEBUGMODE
  );
  log.magenta("Checking session", "checkSessionObject", LogState.DEBUGMODE);
  if (!req.session) {
    log.red(`Force exit.`, "checkSessionObject", LogState.DEBUGMODE);
    throw new DatabaseError(
      "Session object is not yet initialized. Make sure that you have configured your session."
    );
  }
  log.green(
    `Done. Session object exists.`,
    "checkSessionObject",
    LogState.DEBUGMODE
  );
};

/**
 * Sets the connection ID in the request session.
 *
 * @param req - The request object.
 * @param id - The connection ID to set.
 * @throws DatabaseError - If there is an error setting the connection ID.
 */
const setConnectionId = (req: TralseRequest, id: string): void => {
  try {
    log.magenta("Setting connection id", "setConnectionId", LogState.DEBUGMODE);

    checkSessionObject(req);
    req.session.tralse_db_mysql = {
      connectionId: id,
    };

    log.green(
      "Connection set. tralse_db_mysql initialized in session.",
      "setConnectionId",
      LogState.DEBUGMODE
    );
  } catch (error: any) {
    log.red(`Force exit.`, "setConnectionId", LogState.DEBUGMODE);
    throw new DatabaseError(error.message, error.code);
  }
};

/**
 * Gets the connection ID from the request session.
 *
 * @param req - The request object.
 * @returns The connection ID.
 * @throws DatabaseError - If the connection is not initialized or there is an error getting the connection ID.
 */
const getConnectionId = (req: TralseRequest): string => {
  try {
    log.magenta("Getting connection id", "getConnectionId", LogState.DEBUGMODE);

    if (
      !req.session.tralse_db_mysql ||
      !req.session.tralse_db_mysql.connectionId
    ) {
      throw new DatabaseError(
        "Connection is not yet initialized.",
        "CONN_NOT_INIT"
      );
    }
    log.green("Connection fetched", "getConnectionId", LogState.DEBUGMODE);
    return req.session.tralse_db_mysql.connectionId;
  } catch (error: any) {
    log.red(`Force exit.`, "getConnectionId", LogState.DEBUGMODE);
    throw new DatabaseError(error.message, error.code);
  }
};

/**
 * Serializes a database connection into the session and manager.
 *
 * @param req - The request object.
 * @param connection - The MySQL connection to serialize.
 */
export const serializeConnection = (
  req: TralseRequest,
  connection: Connection
): void => {
  try {
    log.magenta(
      "Starting serialization...",
      "serializeConnection",
      LogState.DEBUGMODE
    );
    // Obtain the connection ID from the threadId of the connection
    const connectionId = connection.threadId.toString();
    // Set the connection ID in the request session
    setConnectionId(req, connectionId);
    // Store the connection in the connectionManager with its ID as key
    const connectionData: DatabaseObject = {
      connection,
    };
    connectionManager.set(connectionId, connectionData);
    log.brightGreen(
      "Set into connectionManager, setting timeout id",
      "connectionManager",
      LogState.DEBUGMODE
    );

    // Set up timeout to delete connection if not settled within 1 minute
    const timeoutId = setTimeout(() => {
      connectionManager.delete(connectionId);
      clearTimeout(timeoutId);
      log.green(
        "Done. Stale connection deleted.",
        "connectionManager",
        LogState.DEBUGMODE
      );
    }, TIMEOUT_WITHIN);
    connectionData.timeoutId = timeoutId.toString();
    log.green(
      "Done. timeout id set.",
      "serializeConnection",
      LogState.DEBUGMODE
    );
  } catch (error: any) {
    throw new DatabaseError(error.message, error.code);
  }
};

/**
 * Deserializes the connection from the session and manager.
 *
 * @param req - The request object.
 * @returns The deserialized connection data.
 * @throws DatabaseError - If the connection key is not found.
 */
export const deserializeConnection = (
  req: TralseRequest
): { id?: string; data?: DatabaseObject } => {
  try {
    log.magenta(
      "Deserializing connection",
      "deserializeConnection",
      LogState.DEBUGMODE
    );

    // Obtain the connection ID from the request session
    const connectionId = getConnectionId(req);

    // Check if the connection ID exists in the connectionManager
    if (connectionManager.has(connectionId)) {
      log.magenta("Serialized", "deserializeConnection", LogState.DEBUGMODE);

      // If found, return the connection ID and its data
      return { id: connectionId, data: connectionManager.get(connectionId)! };
    } else {
      throw new DatabaseError(
        "Connection is not yet initialized. Connection key not found.",
        "CONN_NOT_INIT"
      );
    }
  } catch (error: any) {
    throw new DatabaseError(error.message, error.code);
  }
};

/**
 * Retrieves the database object from the request.
 *
 * @param req - The request object.
 * @returns The retrieved database object.
 * @throws DatabaseError - If there is an issue deserializing the connection.
 */
export const getDbObject = (req: TralseRequest): DatabaseObject | undefined => {
  log.magenta("Getting DB object...", "getDbObject", LogState.DEBUGMODE);

  try {
    // Deserialize the connection data from the request
    const { data } = deserializeConnection(req);
    return data;
  } catch (error: any) {
    throw new DatabaseError(error.message, error.code);
  }
};

/**
 * Updates the database object in the manager.
 *
 * @param req - The request object.
 * @param updateData - The new properties to update.
 */
/**
 * Updates the database object in the connection manager.
 *
 * @param req - The request object.
 * @param updateData - The data to update the database object with.
 * @throws DatabaseError - If there is an issue updating the database object.
 */
export const updateDbObject = (
  req: TralseRequest,
  updateData: Partial<DatabaseObject>
): void => {
  try {
    log.magenta("Inside updateDbObject", "updateDbObject", LogState.DEBUGMODE);

    // Deserialize the connection data from the request
    const { id, data } = deserializeConnection(req);

    if (id && data) {
      // Update the database object in the connectionManager
      connectionManager.set(id, { ...data, ...updateData });

      log.magenta(
        "updateDbObject updated",
        "updateDbObject",
        LogState.DEBUGMODE
      );
    } else {
      throw new DatabaseError("Invalid connection data.");
    }
  } catch (error: any) {
    throw new DatabaseError(error.message, error.code);
  }
};

/**
 * Removes the database object from the manager.
 *
 * @param req - The request object.
 * @throws DatabaseError - If the database object is not found.
 */
export const dispatchDbObject = (req: TralseRequest): void => {
  try {
    // Log the start of the function
    log.magenta(
      "Inside dispatchDbObject",
      "dispatchDbObject",
      LogState.DEBUGMODE
    );

    // Deserialize the connection data from the request
    const { id } = deserializeConnection(req);

    if (id) {
      // Retrieve the connection data
      const connectionData = connectionManager.get(id);

      // If a timeout ID exists, clear the timeout
      if (connectionData?.timeoutId) {
        clearTimeout(connectionData.timeoutId);
        log.magenta("Timeout cleared.", "dispatchDbObject", LogState.DEBUGMODE);
      }

      // Delete the connection data from the connectionManager
      connectionManager.delete(id);
      log.magenta(
        "Deleted in connectionManager",
        "dispatchDbObject",
        LogState.DEBUGMODE
      );
    } else {
      throw new DatabaseError("Invalid connection ID.");
    }
  } catch (error: any) {
    throw new DatabaseError(error.message, error.code);
  }
};
