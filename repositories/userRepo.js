import pool from "../lib/db.js";

async function getAll() {
	const { rows } = await pool.query(
		`SELECT id, full_name, phone, role FROM users ORDER BY created_at DESC`,
	);
	return rows;
}
async function create(data) {
	const { full_name, phone, role } = data;
	const { rows } = await pool.query(
		"INSERT INTO users (full_name, phone, role) VALUES ($1, $2, $3) RETURNING *",
		[full_name, phone, role],
	);
	return rows[0];
}
async function updateRole(id, role) {
	await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
}
async function deleteById(id) {
	await pool.query("DELETE FROM users WHERE id = $1", [id]);
}
export default {
	getAll,
	create,
	updateRole,
	deleteById,
};
