import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

let prisma;

if (process.env.VERCEL) {
	// Vercel muhiti uchun
	const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL });
	prisma = new PrismaClient({ adapter: pool });
} else {
	// Local development uchun
	if (!globalForPrisma.prisma) {
		const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL });
		globalForPrisma.prisma = new PrismaClient({ adapter: pool });
	}
	prisma = globalForPrisma.prisma;
}

export default prisma;
