import pool from "../lib/db.js";

async function create(data) {
	const { username, phone, hash, role } = data;
	const { rows } = await pool.query(
		`INSERT INTO users (username, phone, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, username, role`,
		[username, phone, hash, role],
	);
	return rows[0];
}
async function get(username) {
	const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [
		username,
	]);
	return rows[0];
}

export default { create, get };
