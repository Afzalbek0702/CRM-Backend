import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export async function create(req, res) {
	const { name, subdomain, adminName, adminPhone, adminPassword, phone, password } =
		req.body;

	// Xavfsizlik tekshiruvi (Sizning kodingizdagi mantiq)
	if (
		(phone === "998905423747" || phone === "998914977444") &&
		(password === "admin3747" || password === "admin7444")
	) {
		try {
			const result = await prisma.$transaction(async tx => {
				// 1. Tenant yaratish
				const tenant = await tx.tenants.create({
					data: {
						name: name,
						subdomain: subdomain,
					},
				});

				// Parolni hash qilish
				const salt = await bcrypt.genSalt(10);
				const password_hash = await bcrypt.hash(adminPassword, salt);

				// 2. Admin User yaratish
				const admin = await tx.users.create({
					data: {
						phone: adminPhone,
						password_hash: password_hash,
						role: "CEO", // Role Enum bo'lsa, mosligini tekshiring
						tenant_id: tenant.id,
					},
				});

				// 3. Worker yaratish (User bilan bog'langan holda)
				const worker = await tx.workers.create({
					data: {
						user_id: admin.id,
						tenant_id: tenant.id,
                  full_name: adminName,
                  phone: adminPhone,
						position: `CEO of ${name}`,
						status: "ACTIVE",
					},
				});

				return { tenant, admin, worker };
			});

			return res.status(200).json({
				message: "Tenant muvaffaqiyatli yaratildi",
				data: result,
			});
		} catch (error) {
			console.error("Tranzaksiya xatosi:", error);
			return res
				.status(500)
				.json({ error: "Tenant yaratishda xatolik yuz berdi" });
		}
	} else {
		return res.status(403).json({ error: "Ruxsat berilmagan!" });
	}
}
