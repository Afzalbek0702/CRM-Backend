import pool from "../lib/db.js";

async function getAll() {
	const { rows } = await pool.query(
		`SELECT g.id, g.name, g.price, g.course_type, g.lesson_time, g.lesson_days, g.status,t.id AS teacher_id, t.full_name AS teacher FROM groups g JOIN teachers t ON t.id = g.teacher_id WHERE g.status = 'ACTIVE';`,
	);
	return rows;
}
async function getById(id) {
	const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [id]);
	return rows[0];
}
async function create(data) {
	const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
		data;
	const { rows } = await pool.query(
		`INSERT INTO groups (name, course_type, price, lesson_time, lesson_days, teacher_id) VALUES ($1, $2, $3, $4, $5, $6)RETURNING *;`,
		[name, course_type, price, lesson_time, lesson_days, teacher_id],
	);
	return rows[0];
}
async function getStudentInGroup(id) {
	const { rows } = await pool.query(
		`SELECT s.id, s.full_name, s.phone FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.group_id = $1 AND e.status = 'ACTIVE' AND s.status = 'ACTIVE';`,
		[id],
	);
	return rows;
}
async function update(id, data) {
	const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
		data;
	const { rows } = await pool.query(
		`UPDATE groups SET name = $1, course_type = $2, price = $3, lesson_time = $4, lesson_days = $5, teacher_id = $6 WHERE id = $7 RETURNING *;`,
		[name, course_type, price, lesson_time, lesson_days, teacher_id, id],
	);
	return rows[0];
}
async function deleteById(id) {
	const groupResult = await pool.query(
		`UPDATE groups SET status = 'ARCHIVED' WHERE id = $1 RETURNING *`,
		[id],
	);

	const enrollmentsResult = await pool.query(
		`UPDATE enrollments SET status = 'FINISHED', end_date = CURRENT_DATE WHERE group_id = $1 RETURNING *`,
		[id],
	);
	return {
		group: groupResult.rows[0],
		updatedEnrollments: enrollmentsResult.rows,
		enrollmentCount: enrollmentsResult.rowCount,
	};
}

export default {
   getAll,
   getById,
   create,
   getStudentInGroup,
   update,
   deleteById,
}