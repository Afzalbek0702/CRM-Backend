import prisma from "../lib/prisma.js";
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

async function getAll(tenant_id) {
	const students = await prisma.students.findMany({
      where: {
         tenant_id:tenant_id,
			status: {
				not: "DELETED",
			},
		},
		include: {
			enrollments: {
				where: {
					status: "ACTIVE",
				},
				orderBy: {
					joined_at: "desc",
				},
				take: 1,
				include: {
					groups: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		orderBy: { full_name: "asc" },
	});
	const payments = await prisma.payments.groupBy({
		by: ["student_id"],
		where: {
			paid_at: {
				gte: monthStart,
				lt: monthEnd,
			},
		},
		_sum: {
			amount: true,
		},
		_max: {
			paid_at: true,
		},
	});
	const paymentMap = new Map();

	for (const p of payments) {
		paymentMap.set(p.student_id, {
			monthly_paid: Number(p._sum.amount ?? 0),
			last_monthly_payment: p._max.paid_at,
		});
	}
	const result = students.map((student) => {
		const payment = paymentMap.get(student.id) ?? {
			monthly_paid: 0,
			last_monthly_payment: null,
		};
		const enrollment = student.enrollments[0]; // faqat birinchi
		return {
			id: student.id,
			full_name: student.full_name,
			phone: student.phone,
			status: student.status,
         balance: student.balance,
         birthday: student.birthday,
			parents_name: student.parents_name,
			parents_phone: student.parents_phone,
			deleted_at: student.deleted_at,
			groups: enrollment
				? { id: enrollment.groups.id, name: enrollment.groups.name }
				: null,
			monthly_paid: payment.monthly_paid,
			last_monthly_payment: payment.last_monthly_payment,
		};
	});
	return result;
}
async function getById(id, tenant_id) {
	const student = await prisma.students.findUnique({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		include: {
			enrollments: {
				where: { status: "ACTIVE" },
				orderBy: { joined_at: "desc" },
				take: 1,
				include: {
					groups: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
	});

	if (!student) throw { message: "O'quvchi topilmadi", statusCode: 404 };
	const paymentAgg = await prisma.payments.aggregate({
		where: {
			student_id: parseInt(id),
			paid_at: {
				gte: monthStart,
				lt: monthEnd,
			},
		},
		_sum: {
			amount: true,
		},
		_max: {
			paid_at: true,
		},
	});
	const enrollment = student.enrollments[0];
	const group = enrollment
		? {
				id: enrollment.groups.id,
				name: enrollment.groups.name,
			}
		: null;
	return {
		id: student.id,
		full_name: student.full_name,
		phone: student.phone,
		status: student.status,
		balance: student.balance,
		birthday: student.birthday,
		parents_name: student.parents_name,
		parents_phone: student.parents_phone,
		deleted_at: student.deleted_at,
		group,
		monthly_paid: Number(paymentAgg._sum.amount ?? 0),
		last_monthly_payment: paymentAgg._max.paid_at,
	};
}
async function create(data) {
   const existing = await prisma.students.findFirst({
      where: {
         tenant_id:data.tenant_id,
         phone: data.phone,
      }
   })
   if (existing) {
      throw { message: "Bu telefon raqam bilan o'quvchi allaqachon mavjud", statusCode: 400 };
   }

	return await prisma.students.create({
		data: {
			full_name: data.full_name,
			phone: data.phone,
			birthday: data.birthday ? new Date(data.birthday) : null,
			parents_name: data.parents_name,
         parents_phone: data.parents_phone,
         tenant_id:data.tenant_id
		},
	});
}

async function update(id, data) {
	return await prisma.students.update({
		where: {tenant_id:data.tenant_id, id: parseInt(id) },
		data: {
			full_name: data.full_name,
			phone: data.phone,
			birthday: data.birthday ? new Date(data.birthday) : null,
			parents_name: data.parents_name,
			parents_phone: data.parents_phone,
		},
	});
}

async function updateStatus(id, status, tenant_id) {
	return await prisma.students.update({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		data: { status },
	});
}

async function softDelete(id, tenant_id) {
	return await prisma.students.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: {
			status: "DELETED",
			deleted_at: new Date(),
		},
	});
}

async function hardDelete(id, tenant_id) {
	const result = await prisma.students.delete({
		where: { tenant_id: tenant_id, id: parseInt(id) },
	});
	return !!result;
}

async function getStudentProfile(id, tenant_id) {
	const studentId = parseInt(id);
	const data = await prisma.students.findUnique({
		where: {tenant_id:tenant_id, id: studentId },
		include: {
			enrollments: {
				include: { groups: true },
			},
			payments: {
				include: { groups: true },
				orderBy: { paid_at: "desc" },
			},
			attendance: {
				include: { groups: true },
				orderBy: { lesson_date: "desc" },
			},
		},
	});

	if (!data) throw { message: "O'quvchi topilmadi", statusCode: 404 };

	// Balans hisoblash (JS-da qilish bazaga SQL JOIN-lardan ko'ra kamroq yuk beradi)
	const totalDebt = data.enrollments.reduce(
		(sum, e) => sum + (Number(e.groups?.price) || 0),
		0,
	);
	const totalPaid = data.payments.reduce(
		(sum, p) => sum + (Number(p.amount) || 0),
		0,
	);

	return {
		student: {
			id: data.id,
			full_name: data.full_name,
			phone: data.phone,
			status: data.status,
			balance: totalDebt - totalPaid,
		},
		attendance: data.attendance.map((a) => ({
			lesson_date: a.lesson_date,
			status: a.status,
			group_name: a.groups?.name,
		})),
		payments: data.payments.map((p) => ({
			amount: p.amount,
			paid_at: p.paid_at,
			group_name: p.groups?.name,
		})),
	};
}

async function transferStudent(data) {
	const { student_id, from_group_id, to_group_id, tenant_id } = data;

	return await prisma.$transaction(async (tx) => {
		// 1. Eskisini arxivlash
		await tx.enrollments.updateMany({
         where: {
            tenant_id:tenant_id,
				student_id: parseInt(student_id),
				group_id: parseInt(from_group_id),
				status: "ACTIVE",
			},
			data: { status: "ARCHIVED" },
		});

		// 2. Yangisiga qo'shish (Agar hali mavjud bo'lmasa)
		const existing = await tx.enrollments.findFirst({
			where: {
				student_id: parseInt(student_id),
				group_id: parseInt(to_group_id),
				status: "ACTIVE",
			},
		});

		if (!existing) {
			await tx.enrollments.create({
				data: {
					student_id: parseInt(student_id),
					group_id: parseInt(to_group_id),
					status: "ACTIVE",
					joined_at: new Date(),
				},
			});
		}

		return { message: "Student muvaffaqiyatli transfer qilindi" };
	});
}

async function removeStudentFromGroup(studentId, groupId, tenant_id) {
	const result = await prisma.enrollments.updateMany({
      where: {
         tenant_id:tenant_id,
			student_id: parseInt(studentId),
			group_id: parseInt(groupId),
			status: "ACTIVE",
		},
		data: {
			status: "ARCHIVED",
			archived_at: new Date(),
		},
	});

	if (result.count === 0)
		throw {
			message: "O'quvchi bu guruhda topilmadi yoki allaqachon o'chirilgan",
			statusCode: 404,
		};

	return { message: "Student muvaffaqiyatli guruhdan o'chirildi" };
}

export default {
	getAll,
	getById,
	create,
	update,
	updateStatus,
	softDelete,
	hardDelete,
	getStudentProfile,
	transferStudent,
	removeStudentFromGroup,
};
