import pool from "../lib/db.js";

export async function get() {
	const { rows } = await pool.query(
		"SELECT * FROM enrollments WHERE status = 'ACTIVE' ",
	);
	return rows;
}
export async function create(student_id, group_id) {
	const { rows } = await pool.query(
		"INSERT INTO enrollments (student_id, group_id) VALUES ($1, $2) RETURNING *",
		[student_id, group_id],
	);
	return rows[0];
}
// export default { create, get };
