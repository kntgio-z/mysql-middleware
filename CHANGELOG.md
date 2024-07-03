# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.0.0](https://github.com/kntgio-z/mysql-middleware/compare/v3.2.0...v4.0.0) (2024-07-03)


### Features

* Revamp the logic of the middleware. Adopts the concept of @tralse/postgres-middleware logic for better execution ([940db1f](https://github.com/kntgio-z/mysql-middleware/commit/940db1f383f17ca03b57068f8239bf140621e98a))

## [3.2.0](https://github.com/kntgio-z/mysql-middleware/compare/v3.1.0...v3.2.0) (2024-06-17)


### Bug Fixes

* **rollback:** Fix bug where rollback didnt proceed due to an outdated logic ([79a3d10](https://github.com/kntgio-z/mysql-middleware/commit/79a3d106c14a33a383e8e5074d4bf145b8819a53))

## [3.1.0](https://github.com/kntgio-z/mysql-middleware/compare/v3.0.1...v3.1.0) (2024-06-16)


### Features

* **ref:** Change logic of reference number. Now, reference number is now fetched on the retrieve method, together with other details: connection flag and timestamp. ([0ea301e](https://github.com/kntgio-z/mysql-middleware/commit/0ea301e16e17dcd3c181ed9958bb252518acef55))

### [3.0.1](https://github.com/kntgio-z/mysql-middleware/compare/v3.0.0...v3.0.1) (2024-06-16)

## [3.0.0](https://github.com/kntgio-z/mysql-middleware/compare/v2.4.0...v3.0.0) (2024-06-16)


### Features

* **reference number:** Add new feature for transactions. Every transaction instance can run the built in reference number generator. ([03ed018](https://github.com/kntgio-z/mysql-middleware/commit/03ed0181fc339a7b13b25f254530f035a0a4ff85))
* **transaction:** Add new feature on transaction, which can make one or more queries in a transaction instead of just one. ([a6f2f2d](https://github.com/kntgio-z/mysql-middleware/commit/a6f2f2d819a521e859cedee89ff8d61e56145122))

## [2.4.0](https://github.com/kntgio-z/mysql-middleware/compare/v2.3.1...v2.4.0) (2024-06-16)


### Bug Fixes

* **auto rollback in transactions:** Remove auto rollback in transactions methods init and commit. ([a9a867d](https://github.com/kntgio-z/mysql-middleware/commit/a9a867d3c491c9a780c5205821936bfbb10a3555))

### [2.3.1](https://github.com/kntgio-z/mysql-middleware/compare/v2.3.0...v2.3.1) (2024-06-16)


### Bug Fixes

* **types:** Fix type bugs where there is incompatibility in typings of methods. ([a098551](https://github.com/kntgio-z/mysql-middleware/commit/a098551eb702f8150af13bf03b2f5f4047d51d2e))

## [2.3.0](https://github.com/kntgio-z/mysql-middleware/compare/v2.2.0...v2.3.0) (2024-06-16)


### Features

* **referenceNumber:** Add built-in feature for making reference number ([09a9cff](https://github.com/kntgio-z/mysql-middleware/commit/09a9cffaf92c8addaa22251d6f29660659df43fd))

## [2.2.0](https://github.com/kntgio-z/mysql-middleware/compare/v2.1.0...v2.2.0) (2024-06-15)

## [2.1.0](https://github.com/kntgio-z/mysql-middleware/compare/v2.0.1...v2.1.0) (2024-06-05)


### Bug Fixes

* **query:** Fix the code logic where the parralel and sequential ops are interchanged ([688a718](https://github.com/kntgio-z/mysql-middleware/commit/688a718645e54bf1c7712abd366a33f945ed1a80))

### [2.0.1](https://github.com/kntgio-z/mysql-middleware/compare/v2.0.0...v2.0.1) (2024-06-05)

## [2.0.0](https://github.com/kntgio-z/mysql-middleware/compare/v1.0.0...v2.0.0) (2024-06-05)


### Features

* **query:** Add options object params. ([a0eb2c6](https://github.com/kntgio-z/mysql-middleware/commit/a0eb2c6f04c2839a7552383839bf2e0060bb2723))

## [1.0.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.6.1...v1.0.0) (2024-06-05)

### [0.6.1](https://github.com/kntgio-z/mysql-middleware/compare/v0.6.0...v0.6.1) (2024-06-05)

## [0.6.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.5.3...v0.6.0) (2024-06-05)


### Features

* **query:** Enable use of executeDbQuery, providing a query with deadlock management ([872755a](https://github.com/kntgio-z/mysql-middleware/commit/872755a2eba9f087e12e1b013b5c772b9693a6f3))

### [0.5.3](https://github.com/kntgio-z/mysql-middleware/compare/v0.5.2...v0.5.3) (2024-06-04)

### [0.5.2](https://github.com/kntgio-z/mysql-middleware/compare/v0.5.1...v0.5.2) (2024-06-04)

### [0.5.1](https://github.com/kntgio-z/mysql-middleware/compare/v0.5.0...v0.5.1) (2024-06-04)

## [0.5.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.4.1...v0.5.0) (2024-06-04)


### Bug Fixes

* **releaseConnection:** Ignores error in releaseConnection method if the error code is CONN_NOT_INIT, providing a successful throw on error in the code. ([7a77b02](https://github.com/kntgio-z/mysql-middleware/commit/7a77b021e19e2ae8ed44e9f04f89d98493cd32cc))

### [0.4.1](https://github.com/kntgio-z/mysql-middleware/compare/v0.4.0...v0.4.1) (2024-06-04)

## [0.4.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.3.0...v0.4.0) (2024-06-04)


### Bug Fixes

* **connection:** Fix bug where connection not reference to result object ([d51d11a](https://github.com/kntgio-z/mysql-middleware/commit/d51d11a10887a1532ece2c444d6d7478f930cd08))

## [0.3.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.2.0...v0.3.0) (2024-06-04)

## [0.2.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.1.0...v0.2.0) (2024-06-04)

## [0.1.0](https://github.com/kntgio-z/mysql-middleware/compare/v0.0.12...v0.1.0) (2024-06-03)
