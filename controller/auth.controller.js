import { sendError, sendSuccess } from "../lib/response.js";
import authService from "../services/auth.service.js";

export async function registerWorker(req, res) {
	const { full_name, phone, password, salary, birthday, position, img } =
		req.body;

	if (!phone || !password || !full_name || !position) {
		return sendError(
			res,
			"Majburiy maydonlar to‘ldirilmagan! phone, password, full_name, position",
			400,
		);
	}

	try {
		const data = await authService.registerWorker({
			full_name,
			phone,
			password,
			salary,
			birthday,
			position,
			img,
		});

		sendSuccess(res, data, 201);
	} catch (err) {
		sendError(
			res,
			err.message || "Registerda xatolik",
			err.statusCode || 500,
			err,
		);
	}
}

export async function login(req, res) {
	const { phone, password } = req.body;

	try {
		const data = await authService.login(phone, password);
		res.cookie("token", data.token, {
			httpOnly: true,
         secure: true,
         // domain:'.vercel.app',
			sameSite: "none",
			maxAge: 24 * 60 * 60 * 1000,
		});

		sendSuccess(res, data.user);
	} catch (error) {
		sendError(
			res,
			error.message || "Server xatosi",
			error.statusCode || 500,
			error,
		);
	}
}

export async function changePassword(req, res) {
	const userId = req.user.id;
	const { oldPassword, newPassword } = req.body;

	try {
		const data = await authService.updatePassword(
			userId,
			oldPassword,
			newPassword,
		);

		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "Server xatosi",
			error.statusCode || 500,
			error,
		);
	}
}
