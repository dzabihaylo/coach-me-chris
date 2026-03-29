import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Always use a file URL for schema validation.
    // The actual connection is handled by the driver adapter at runtime.
    url: "file:./prisma/dev.db",
  },
});
