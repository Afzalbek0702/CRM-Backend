import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
export async function create(req, res) {
	const { password, phone, name, subdomain, adminPhone, adminPassword } =
		req.body;
	console.log(password, phone, name, subdomain, adminPhone, adminPassword);

	if (
		phone == "998905423747" ||
		(phone == "998914977444" && password == "admin3747") ||
		password == "admin7444"
	) {
		const tenant = await prisma.tenants.create({
			data: { name: name, subdomain: subdomain },
		});
		const salt = await bcrypt.genSalt(10);
		const password_hash = await bcrypt.hash(adminPassword, salt);
		const admin = await prisma.users.create({
			data: {
				phone: adminPhone,
				password_hash: password_hash,
				role: "CEO",
				tenant_id: tenant.id,
			},
		});
		res.status(200).json(admin);
	}
}
