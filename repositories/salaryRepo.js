import pool from "../lib/db.js";

async function get() {
	const { rows } = await pool.query(
		`SELECT * FROM salary WHERE status = 'ACTIVE'`,
	);
	return rows;
}
async function create(data) {
	const { full_name, amount, method, description } = data;
	await pool.query(
		`INSERT INTO salary (full_name, amount, method, description) VALUES ($1, $2, $3, $4)`,
		[full_name, amount, method, description],
	);
}
async function update(data) {
	const { full_name, amount, method, description, id } = data;
	await pool.query(
		`UPDATE salary SET full_name = $1, amount = $2, method = $3, description = $4 WHERE id = $5`,
		[full_name, amount, method, description, id],
	);
}
async function deleteById(id) {
	await pool.query(`UPDATE salary SET status = 'DELETED' WHERE id = $1`, [id]);
}
export default { get, create, update, deleteById };
