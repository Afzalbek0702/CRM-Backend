import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.routes.js";
import apiRoutes from "./routes/api.routes.js";
import { requireRole } from "./middleware/roleMiddleware.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";

// Initialize Express app
const app = express();

// Middleware
const corsOption = {
	origin: "http://localhost:5173", 
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	exposedHeaders: ["Set-Cookie"], 
};
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOption));
app.use(helmet());


// Routes
app.use("/auth", authRouter);
app.use("/api", authMiddleware, requireRole("admin", "manager"), apiRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root endpoint
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "view", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 7000;
console.log("Server is running on", PORT);
app.listen(PORT);
