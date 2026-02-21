import express from "express";
import authRouter from "./routes/auth-routes.js";
import cors from "cors";
import { authMiddleware } from "./lib/authMiddleware.js";
import apiRoutes from "./routes/api-routes.js";
import { requireRole } from "./lib/roleMiddleware.js";
// Initialize Express app
const app = express();
// Middleware
const corsOption = {
	// credentials: true,
};
app.use(express.json());
app.use(cors(corsOption));
// Routes
app.use("/auth", authRouter);
app.use("/api", authMiddleware, requireRole("admin", "manager"), apiRoutes);
// Root endpoint
app.get("/", (_, res) => {
	res.send("Server is running...");
});
// Start the server
const PORT = process.env.PORT || 7000;
console.log("Server is running on",PORT);
app.listen(PORT);