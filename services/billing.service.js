import prisma from "../lib/prisma.js";

export async function chargeMonthlyFees() {
	const now = new Date();
	// Joriy oyning birinchi sanasi, soat 00:00:00
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	try {
		// Tranzaksiya ichida bajarish tavsiya etiladi
		const result = await prisma.$transaction(async (tx) => {
			const updatedCount = await tx.$executeRaw`
        UPDATE "students" s
        SET 
          balance = s.balance - sub.total_price,
          "last_billed_at" = NOW()
        FROM (
          SELECT e.student_id, SUM(g.price) as total_price
          FROM "enrollments" e
          JOIN "groups" g ON e.group_id = g.id
          WHERE e.status = 'ACTIVE'
          GROUP BY e.student_id
        ) as sub
        WHERE s.id = sub.student_id 
          AND s.status = 'ACTIVE'
          -- Faqat shu oyda hali pul yechilmagan talabalarni filtrlaymiz
          AND (s."last_billed_at" < ${startOfMonth} OR s."last_billed_at" IS NULL);
      `;

			return updatedCount;
		});

		return {
			success: true,
			updatedStudents: result,
			billedAt: now.toISOString(),
		};
	} catch (error) {
		console.error("CRITICAL: Billing execution failed:", error);
		throw error; // API handler buni ushlab 500 qaytaradi
	}
}
