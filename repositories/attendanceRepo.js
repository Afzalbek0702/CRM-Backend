import pool from "../lib/db.js";

async function set(data) {
	const { group_id, student_id, lesson_date, status } = data;
	const { rows } = await pool.query(
		`INSERT INTO attendance (group_id, student_id, lesson_date, status)
         VALUES ($1, $2, $3, $4) ON CONFLICT (group_id, student_id, lesson_date)
         DO UPDATE SET status = $4
         RETURNING *`,
		[group_id, student_id, lesson_date, status],
	);
	return rows[0];
}
async function group(group_id) {
	const groupResult = await pool.query(
		`SELECT lesson_days FROM groups WHERE id = $1 AND status = 'ACTIVE'`,
		[group_id],
	);
	return groupResult;
}

async function student(group_id) {
	// Guruhdagi o'quvchilarni olish
	const studentsResult = await pool.query(
		`SELECT s.id, s.full_name FROM students s JOIN enrollments e ON s.id = e.student_id WHERE e.group_id = $1 AND e.status = 'ACTIVE' AND s.status = 'ACTIVE' ORDER BY s.full_name`,
		[group_id],
	);
	return studentsResult;

	// Davomatni olish (to'g'ri ustun nomi ishlatilishi kerak)
}
async function attendance(student_id, group_id, dateStr) {
	const attendanceResult = await pool.query(
		`SELECT status FROM attendance WHERE student_id = $1 AND group_id = $2 AND lesson_date = $3`,
		[student_id, group_id, dateStr],
	);
	return attendanceResult;
}

export default { attendance, group, set, student };
