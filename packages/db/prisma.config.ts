import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // process.env y no env(): `prisma generate` (build, CI, Docker) no necesita
  // base de datos y no debe fallar si DATABASE_URL no está definida.
  datasource: { url: process.env.DATABASE_URL },
});
