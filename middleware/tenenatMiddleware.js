import prisma from "../lib/prisma.js";

export const tenantMiddleware = async (req, res, next) => {
	const tenantName = req.params.tenantName;

   if (!tenantName) {
		return res.status(400).json({ error: "Tenant required" });
	}

	const tenant = await prisma.tenants.findUnique({
		where: { subdomain: tenantName },
	});

	if (!tenant) {
		return res.status(404).json({ error: "Tenant not found" });
	}

	req.tenantId = tenant.id;
	next();
};
