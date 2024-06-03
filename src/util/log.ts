import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const conditional = (message: string): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log(message);
  }
};

const blue = (message: string, header: string = "tralseDb"): void => {
  conditional(chalk.blue(`[${header}] ${message}`));
};

const green = (message: string, header: string = "tralseDb"): void => {
  conditional(chalk.green(`[${header}] ${message}`));
};

const red = (message: string, header: string = "tralseDb"): void => {
  conditional(chalk.red(`[${header}] ${message}`));
};

const magenta = (message: string, header: string = "tralseDb"): void => {
  conditional(chalk.magenta(`[${header}] ${message}`));
};

export const log = { blue, green, red, magenta };
