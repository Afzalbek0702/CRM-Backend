import pool from "../lib/db.js";

async function getAll() {
	const { rows } =
		await pool.query(`SELECT p.id, p.amount, p.paid_at, p.paid_month, p.method, s.full_name AS student_name, g.name AS group_name FROM payments p JOIN students s ON s.id = p.student_id JOIN groups g ON g.id = p.group_id WHERE p.status != 'DELETED' ORDER BY p.paid_at DESC;
`);
	return rows;
}
async function create(data) {
	const { student_id, group_id, amount, method, paid_month } = data;
	const { rows } = await pool.query(
		"INSERT INTO payments (student_id, group_id, amount, method, paid_month) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
		[student_id, group_id, amount, method, paid_month],
	);
	return rows[0];
}
async function getById(id) {
	const { rows } = await pool.query("SELECT * FROM payments WHERE id = $1;", [
		id,
	]);
	return rows[0];
}
async function update(id, data) {
	const { student_id, group_id, amount, type, paid_month } = data;
	const { rows } = await pool.query(
		"UPDATE payments SET student_id = $1, group_id = $2, amount = $3, type = $4, paid_month = $5 WHERE id = $6 RETURNING *;",
		[student_id, group_id, amount, type, paid_month, id],
	);
	return rows[0];
}
async function deleteById(id) {
   const { rows } = await pool.query(
			"UPDATE payments SET status = 'DELETED', deleted_at = NOW() WHERE id = $1 RETURNING *;",
			[id],
		);
   return rows[0];
}

export default {
   getAll,
   create,
   getById,
   update,
   deleteById,
};