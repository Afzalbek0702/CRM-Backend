import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendError, sendSuccess } from "../lib/response.js";
import authRepo from "../repositories/authRepo.js";
import pool from "../lib/db.js";

export async function registerWorker(req, res) {
	const { full_name, phone, password, salary, birthday, position, img } =
		req.body;

	if (!phone || !password || !full_name || !position) {
		return sendError(res, "Majburiy maydonlar to‘ldirilmagan", 400);
	}

	try {
		await pool.query("BEGIN");

		const hash = await bcrypt.hash(password, 10);

		// 1. user yaratamiz
		const userResult = await authRepo.userCreate(phone, hash, position);
		console.log(userResult);

		const userId = userResult[0].id;

		// 2. worker yaratamiz
		await authRepo.workerCreate({
			userId,
			full_name,
			phone,
			position,
			salary,
			birthday,
			img,
		});

		await pool.query("COMMIT");
		sendSuccess(res, { message: "Xodim muvaffaqiyatli ro‘yxatdan o‘tdi" }, 201);
	} catch (err) {
		await pool.query("ROLLBACK");
		sendError(res, "Registerda xatolik", 500, err);
	}
}

export async function login(req, res) {
	const { phone, password } = req.body;

	const result = await authRepo.checkLogin(phone);

	if (result.rowCount === 0) {
		return sendError(res, "Telefon raqam noto‘g‘ri", 400);
	}

	const user = result.rows[0];

	const match = await bcrypt.compare(password, user.password_hash);
	if (!match) {
		return sendError(res, "Parol noto‘g‘ri", 400);
	}

	const token = jwt.sign(
		{ id: user.id, role: user.role },
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRES,
		},
	);

	sendSuccess(res, {
		token,
		user: {
			id: user.id,
			full_name: user.full_name,
			role: user.role,
		},
	});
}

export async function changePassword(req, res) {
	const userId = req.user.id;

	const { oldPassword, newPassword } = req.body;

	if (!oldPassword || !newPassword) {
		return sendError(res, "Passwordlar to‘liq emas", 400);
	}

	try {
		// 1. userni olamiz
		const result = await pool.query(
			`SELECT password_hash FROM users WHERE id = $1`,
			[userId],
		);

		if (result.rowCount === 0) {
			return sendError(res, "User topilmadi", 404);
		}

		const user = result.rows[0];

		// 2. eski passwordni tekshiramiz
		const match = await bcrypt.compare(oldPassword, user.password_hash);
		if (!match) {
			return sendError(res, "Eski password noto‘g‘ri", 400);
		}

		// 3. yangi passwordni hashlaymiz
		const newHash = await bcrypt.hash(newPassword, 10);

		// 4. update qilamiz
		await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
			newHash,
			userId,
		]);

		sendSuccess(res, { message: "Password muvaffaqiyatli yangilandi" });
	} catch (error) {
		sendError(res, "Password update xatosi", 500, error);
	}
}
