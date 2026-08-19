/**
 * Vitest setup — mock environment variables pre tests
 */
process.env.ADMIN_SESSION_SECRET = "test-secret-32-chars-long-for-testing-only-xxxx";
process.env.DATABASE_URL = "file:/tmp/test-db.sqlite";
process.env.NODE_ENV = "test";
