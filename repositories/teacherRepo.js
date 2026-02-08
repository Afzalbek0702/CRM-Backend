import pool from "../lib/db.js";

async function getAll() {
	const { rows } = await pool.query("SELECT * FROM teachers;");
	return rows;
}
async function getById(id) {
	const { rows } = await pool.query("SELECT * FROM teachers WHERE id = $1;", [
		id,
	]);
	return rows[0];
}
async function create(data) {
	const { full_name, phone } = data;
	const { rows } = await pool.query(
		"INSERT INTO teachers (full_name, phone) VALUES ($1, $2) RETURNING *",
		[full_name, phone],
	);
	return rows[0];
}
async function update(id, data) {
	const { full_name, phone } = data;
	const { rows } = await pool.query(
		"UPDATE teachers SET full_name = $1, phone = $2 WHERE id = $3 RETURNING *;",
		[full_name, phone, id],
   );
   return rows[0];
}
async function deleteById(id) {
   await pool.query("DELETE FROM teachers WHERE id = $1;", [id]);
   return 
}

export default {
   getAll,
   getById,
   create,
   update,
   deleteById
}