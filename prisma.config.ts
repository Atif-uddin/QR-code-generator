import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost/dummy",
  },
})
