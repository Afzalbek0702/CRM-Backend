import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.routes.js";
import apiRoutes from "./routes/api.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { tenantMiddleware } from "./middleware/tenenatMiddleware.js";
import cookieParser from "cookie-parser";
// Cron-ni bu yerdan olib tashlasangiz ham bo'ladi, chunki Vercel-da u barqaror emas
import { chargeMonthlyFees } from "./services/billing.service.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: (origin, callback) => {
			const allowedOrigins = [
				"http://localhost:5173",
				"https://data-space-crm.vercel.app",
			];
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("CORS blocked"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		exposedHeaders: ["Set-Cookie"],
	}),
);
app.use(helmet());

// 1. CRON Endpoint (Xavfsizlik uchun barcha middleware-lardan tepaga qo'yamiz)
app.get("/api/billing/charge-monthly", async (req, res) => {
	const authHeader = req.headers["authorization"];

	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return res.status(401).json({ error: "Ruxsat berilmagan" });
	}

	try {
		const result = await chargeMonthlyFees(); // Hamma tenantlar uchun ishlaydi
		res.status(200).json({
			success: true,
			processedTenants: result,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// 2. Oddiy yo'nalishlar
app.use("/auth", authRouter);
app.use("/superadmin", superadminRouter);

// 3. Tenant-ga asoslangan API yo'nalishlari
app.use("/:tenantName/api", tenantMiddleware, authMiddleware, apiRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "view", "index.html"));
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
	console.log("Server is running on", PORT);
});

export default app; // Vercel uchun kerak
