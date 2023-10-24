import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};


// Create a new instance of libSQL client
const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
})

// Create a Prisma adapter for libSQL
const adapter = new PrismaLibSQL(libsql) as any // TODO type


export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
