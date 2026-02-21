import pool from "../lib/db.js";

async function get() {
	const { rows } = await pool.query(
		`SELECT * FROM courses WHERE status = 'ACTIVE'`,
	);
	return rows;
}
async function create(name, price, lesson_count) {
	await pool.query(
		`INSERT INTO courses (name, price, lesson_count) VALUES ($1, $2, $3)`,
		[name, price, lesson_count],
	);
}
async function update(data) {
	const { name, price, lesson_count, id } = data;
	await pool.query(
		`UPDATE courses SET name = $1, price = $2, lesson_count = $3 WHERE id = $4`,
		[name, price, lesson_count, id],
	);
}
async function deleteById(id) {
	await pool.query(`UPDATE courses SET status = 'DELETED' WHERE id = $1`, [id]);
}
export default { get, create, update, deleteById };