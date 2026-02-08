import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendError, sendSuccess } from "../lib/response.js";
import loginRepo from '../repositories/loginRepo.js'
export async function login(req, res) {
	const { username, password } = req.body;
   const user = await loginRepo.get(username);
   console.log(user);
   
   
	if (!user) {
		return sendError(res, "Wrong credentials 1", 401);
	}

	const valid = await bcrypt.compare(password, user.password_hash);

	if (!valid) {
		return sendError(res, "Wrong credentials", 401);
	}

	const token = jwt.sign(
		{
			id: user.id,
			role: user.role,
		},
		process.env.JWT_SECRET,
		{ expiresIn: "7d" },
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

export async function register(req, res) {
	const { username, phone, password, role } = req.body;

	const hash = await bcrypt.hash(password, 10);

	const user = loginRepo.create({ username, phone, hash, role });

	sendSuccess(res, user);
}
