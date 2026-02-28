import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: true },
});

const prisma = new PrismaClient({ adapter: pool });

export default prisma;
