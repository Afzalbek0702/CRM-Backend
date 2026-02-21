import pool from "../lib/db.js";

async function create(data) {
	const { description, amount, method, created_by } = data;
	await pool.query(
		`INSERT INTO expenses (description, amount, method, created_by) VALUES ($1, $2, $3, $4)`,
		[description, amount, method, created_by],
	);
}
async function getAll() {
	const { rows } = await pool.query(
		`SELECT * FROM expenses WHERE status = 'DELETED'`,
	);
	return rows;
}
async function update(data) {
	const { description, amount, method, created_by, id } = data;
	await pool.query(
		`UPDATE expenses SET description = $1, amount = $2, method = $3, created_by = $4 WHERE id = $5`,
		[description, amount, method, created_by, id],
	);
}
async function deleteByid(id) {
	await pool.query(`UPDATE expenses SET status = 'DELETED'  WHERE id = $1`, [
		id,
	]);
}

export default { create, deleteByid, getAll, update };
