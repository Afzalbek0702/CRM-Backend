import prisma from "../lib/prisma.js";
import { formatDateForDB, getMonthRange } from "../utils/date.js";
export async function chargeMonthlyFees() {
	const now = new Date();
	const { start: currentMonth, nextStart: nextMonth } = getMonthRange(now);
	const currentMonthStr = formatDateForDB(currentMonth);
	const nextMonthStr = formatDateForDB(nextMonth);

	// 1. Barcha aktiv tenantlarni olish
	const tenants = await prisma.tenants.findMany({
		where: { status: "ACTIVE" },
		select: { id: true },
	});

	const summary = [];

	for (const tenant of tenants) {
		try {
			const result = await prisma.$transaction(async tx => {
				// Shu tenant uchun billing
				const billedStudents = await tx.$queryRaw`
                    WITH students_to_charge AS (
                        SELECT s.id, SUM(g.price) as total_fee
                        FROM "students" s
                        JOIN "enrollments" e ON s.id = e.student_id AND e.status = 'ACTIVE'
                        JOIN "groups" g ON e.group_id = g.id AND g.status = 'ACTIVE'
                        WHERE s.tenant_id = ${tenant.id}
                          AND s.status = 'ACTIVE'
                          AND e.next_billing_date <= ${currentMonthStr}::date
                        GROUP BY s.id
                    )
                    UPDATE "students" s
                    SET balance = s.balance - stc.total_fee, last_billed_at = NOW()
                    FROM students_to_charge stc
                    WHERE s.id = stc.id
                    RETURNING s.id, s.balance;
                `;

				// Shu tenant uchun sanalarni yangilash
				const updatedEnrollments = await tx.$executeRaw`
                    UPDATE "enrollments"
                    SET next_billing_date = ${nextMonthStr}::date
                    WHERE status = 'ACTIVE'
                      AND tenant_id = ${tenant.id}
                      AND next_billing_date <= ${currentMonthStr}::date
                `;

				return {
					tenantId: tenant.id,
					count: billedStudents.length,
				};
			});
			summary.push(result);
		} catch (err) {
			console.error(`Tenant ${tenant.id} billing error:`, err);
		}
	}
	return summary;
}
