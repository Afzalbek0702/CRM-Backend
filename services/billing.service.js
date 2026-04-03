import prisma from "../lib/prisma.js";

export async function chargeMonthlyFees() {
	// 1. Barcha tenantlarni olamiz
	const tenants = await prisma.tenants.findMany();
	let totalAffected = 0;

	// 2. Har bir tenant uchun balansni kamaytiramiz
	for (const tenant of tenants) {
		const count = await prisma.$executeRaw`
      UPDATE "students" s
      SET balance = balance - COALESCE((
        SELECT SUM(g.price)
        FROM "enrollments" e
        JOIN "groups" g ON e.group_id = g.id
        WHERE e.student_id = s.id 
          AND e.status = 'ACTIVE' 
          AND e.tenant_id = ${tenant.id}::uuid
      ), 0)
      WHERE s.status = 'ACTIVE' 
        AND s.tenant_id = ${tenant.id}::uuid;
    `;
		totalAffected += count;
	}

	return { totalTenants: tenants.length, updatedStudents: totalAffected };
}
