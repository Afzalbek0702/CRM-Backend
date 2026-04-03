import { sendError, sendSuccess } from "../lib/response.js";
import authService from "../services/auth.service.js";

export async function registerWorker(req, res) {
	const {
		full_name,
		phone,
		password,
		salary,
		birthday,
		position,
		img,
		salary_type,
		role,
	} = req.body;
	const { tenant } = req.query;

	if (!phone || !password || !full_name || !role) {
		return sendError(
			res,
			"Majburiy maydonlar to‘ldirilmagan! phone, password, full_name, role",
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
			salary_type,
			role,
			tenant,
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
		const data = await authService.login(phone, password, req.tenantId);
		res.cookie("token", data.token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 60 * 60 * 1000,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "Login Serverda xato",
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
			req.tenantId,
		);

		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "Serverda xato",
			error.statusCode || 500,
			error,
		);
	}
}

export async function me(req, res) {
	sendSuccess(res, { user: req.user, tenant: req.tenantId });
}

export async function logout(req, res) {
	res.clearCookie("token", {
		httpOnly: true,
		secure: true,
		sameSite: "none",
	});
	res.status(200).json({ message: "Logged out" });
}
