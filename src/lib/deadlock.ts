import { DatabaseError } from "../errors/error";
import { QueryFunction } from "../types";

export const manageDeadlocks = async (
  maxRetries: number,
  queryFunction: QueryFunction,
  maxBackoffTime: number = 8000
): Promise<any> => {
  const executeQueryWithRetries = async (
    retryCount: number = 0
  ): Promise<any> => {
    console.log("In deadlock");
    
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
        console.log(error);
        throw new DatabaseError(
          `Database error after ${maxRetries} retries: ${error.message}`
        );
      }
    }
  };

  return await executeQueryWithRetries();
};
