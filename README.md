# @tralse/mysql-middleware
test
This package provides a middleware and helpful methods for modularized and remodified modules on MYSQL database, providing a robust development.

## Key Features

- Deadlock management with exponential and controlled backoff
- Modular functions for database operations

## Installation

```bash
npm install @tralse/mysql-middleware express-session express
```

## Usage

- [Usage on TralseMySql](./docs/TRALSEMYSQL.md)
- [Usage on getDbQuery](./docs/DBQUERY.md)

## Errors

- **DatabaseError**: Custom error class for external database-related errors. However, MySQL errors is not caught by this error, for proper tracing for the outer logic.
  - Default Code: `DB_ERR`
- **TransactionError**: Custom error class for transaction-related errors. However, MySQL errors is not caught by this error, for proper tracing for the outer logic.
  - Default Code: `TRANSACTION_ERR`
  - Code: (if connection is not initialized): `CONN_NOT_INIT`

## Changelogs

You can see our changelogs [here](./CHANGELOG.md).

## License

This is licensed under MIT License. [View License](./LICENSE)

## Issues

Bugs found? Kindly inquire to the issues section.

## Contributor/s

- [@kntgio-z](https://github.com/kntgio-z)
