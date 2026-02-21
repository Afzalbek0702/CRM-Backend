import pool from "../lib/db.js";

async function getAll() {
	const { rows } = await pool.query(
		`SELECT * FROM workers`,
	);
	return rows;
}
async function updateRole(id, role) {
	await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
}
async function update(data) {
	const { full_name, phone, position, salary, birthday, img, id, user_id } =
      data;
   await pool.query(`BEGIN`)
	await pool.query(
		`UPDATE workers set full_name = $1, phone = $2, position = $3, salary = $4, birthday = $5, img = $6 WHERE id = $7`,
		[full_name, phone, position, salary, birthday, img, id],
	);
	 await pool.query(`UPDATE users SET phone = $1 WHERE id = $2`, [phone,user_id])

   await pool.query(`COMMIT`)
}
async function deleteById(id) {
	await pool.query("DELETE FROM users WHERE id = $1", [id]);
}
export default {
	getAll,
   updateRole,
   update,
	deleteById,
};
