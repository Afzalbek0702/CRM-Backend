import prisma from "../lib/prisma.js";

export async function get(tenant_id) {
	return await prisma.enrollments.findMany({
      where: {
         tenant_id:tenant_id,
			status: "ACTIVE",
		},
	});
}

export async function create(student_id, group_id, tenant_id) {
	return await prisma.enrollments.create({
		where: { tenant_id: tenant_id },
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
		},
	});
}
