import { DatabaseError } from "../errors/error";
import { QueryFunction } from "../types";
import { log } from "../util/log";
export const manageDeadlocks = async (
  maxRetries: number,
  queryFunction: QueryFunction,
  maxBackoffTime: number = 8000
): Promise<any> => {
  const executeQueryWithRetries = async (
    retryCount: number = 0
  ): Promise<any> => {
    log.magenta("In deadlock");

    try {
      return await queryFunction();
    } catch (error: any) {
      if (
        retryCount < maxRetries &&
        (error.code === "ER_LOCK_DEADLOCK" ||
          error.code === "ER_LOCK_WAIT_TIMEOUT")
      ) {
        const backoffTime = Math.min(
          Math.pow(2, retryCount) * 100,
          maxBackoffTime
        ); // Exponential backoff with a cap

        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        return executeQueryWithRetries(retryCount + 1);
      } else {
        log.magenta(error);
        throw new DatabaseError(
          `Database error after ${maxRetries} retries: ${error.message}`
        );
      }
    }
  };

  return await executeQueryWithRetries();
};
