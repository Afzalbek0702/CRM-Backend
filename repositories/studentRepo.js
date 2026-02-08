import pool from "../lib/db.js";

async function getAll() {
	const { rows } = await pool.query(
		`WITH current_month_payments AS (
  -- Faqat joriy oy to'lovlari bo'yicha yig'indisi va oxirgi sana
  SELECT 
    student_id,
    SUM(amount) AS monthly_paid,
    MAX(paid_at) AS last_monthly_payment
  FROM payments
  WHERE date_trunc('month', paid_at) = date_trunc('month', CURRENT_DATE)
  GROUP BY student_id
),
active_groups AS (
  -- Faqat faol guruhlar nomlari
  SELECT 
    e.student_id,
    array_agg(DISTINCT g.name) AS groups
  FROM enrollments e
  JOIN groups g ON g.id = e.group_id
  WHERE e.status = 'ACTIVE'
  GROUP BY e.student_id
)
SELECT
  s.id,
  s.full_name,
  s.phone,
  s.status,
  s.birthday,
  s.parents_name,
  s.parents_phone,
  s.deleted_at,
  COALESCE(ag.groups, '{}') AS groups,
  COALESCE(cmp.monthly_paid, 0) AS monthly_paid,
  cmp.last_monthly_payment
FROM students s
LEFT JOIN active_groups ag ON ag.student_id = s.id
LEFT JOIN current_month_payments cmp ON cmp.student_id = s.id
WHERE s.status != 'DELETED'
ORDER BY s.full_name;`,
	);
	return rows[0] || [];
}
async function getById(id) {
	const { rows } = await pool.query("SELECT * FROM students WHERE id = $1;", [
		id,
	]);
	return rows[0] || [];
}
async function create(data) {
	const { full_name, phone, birthday, parents_name, parents_phone } = data;

	const { rows } = await pool.query(
		"INSERT INTO students (full_name, phone, birthday, parents_name, parents_phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
		[full_name, phone, birthday, parents_name, parents_phone],
	);

	return rows[0];
}
async function update(id, data) {
	const { full_name, phone, birthday, parents_name, parents_phone } = data;

	const { rows } = await pool.query(
		"UPDATE students SET full_name = $1, phone = $2, birthday = $3, parents_name = $4, parents_phone = $5 WHERE id = $6 RETURNING *",
		[full_name, phone, birthday, parents_name, parents_phone, id],
	);
	return rows[0] || null;
}
async function updateStatus(id, status) {
	await pool.query("UPDATE students SET status = $1 WHERE id = $2", [
		status,
		id,
	]);
}
async function softDelete(id) {
	const { rows } = await pool.query(
		`UPDATE students SET status = 'DELETED', deleted_at = NOW() WHERE id = $1 RETURNING *`,
		[id],
	);
	return rows[0];
}
// Hard delete (faqat admin uchun)
async function hardDelete(id) {
	const { rowCount } = await pool.query("DELETE FROM students WHERE id = $1", [
		id,
	]);
	return rowCount > 0;
}
async function getStudentProfile(id) {
	const studentSql = `SELECT
      s.id,
      s.full_name,
      s.phone,
      s.status,
      COALESCE(SUM(g.price),0) - COALESCE(SUM(p.amount),0) AS balance
      FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id
      LEFT JOIN groups g ON g.id = e.group_id
      LEFT JOIN payments p ON p.student_id = s.id
      WHERE s.id = $1
      GROUP BY s.id;`;
	const attendanceSql = `SELECT
      a.lesson_date,
      a.status,
      g.name AS group_name
      FROM attendance a
      JOIN groups g ON g.id = a.group_id
      WHERE a.student_id = $1
      ORDER BY a.lesson_date DESC;`;
	const paymentsSql = `SELECT
      p.amount,
      p.paid_at,
      g.name AS group_name
      FROM payments p
      LEFT JOIN groups g ON g.id = p.group_id
      WHERE p.student_id = $1
      ORDER BY p.paid_at DESC;`;

	const student = await pool.query(studentSql, [id]);
	const attendance = await pool.query(attendanceSql, [id]);
	const payments = await pool.query(paymentsSql, [id]);

	return {
		student: student.rows[0],
		attendance: attendance.rows,
		payments: payments.rows,
	};
}
async function transferStudent(data) {
	const { student_id, from_group_id, to_group_id } = data;
	await pool.query("BEGIN");
	await pool.query(
		`UPDATE enrollments SET status = 'ARCHIVED' WHERE student_id = $1 AND group_id = $2 AND status = 'ACTIVE'`,
		[student_id, from_group_id],
	);
	await pool.query(
		`INSERT INTO enrollments (student_id, group_id, status, joined_at) SELECT $1, $2, 'ACTIVE', NOW() WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = $1 AND group_id = $2 AND status = 'ACTIVE')`,
		[student_id, to_group_id],
	);
	await pool.query("COMMIT");
	return { msg: "Student muvaffaqiyatli transfer qilindi" };
}
async function removeStudentFromGroup(studentId, groupId) {
	await pool.query("BEGIN");

	const result = await pool.query(
		`UPDATE enrollments SET status = 'ARCHIVED', archived_at = NOW() WHERE student_id = $1 AND group_id = $2 AND status = 'ACTIVE' RETURNING *;`,
		[studentId, groupId],
	);

	if (result.rowCount === 0) {
		return { msg: "Active enrollment not found" };
	}

	await pool.query("COMMIT");
	return {
		msg: "Student muvaffaqiyatli guruhdan o'chirildi",
		enrollment: result.rows[0],
	};
}

export default {
	getAll,
	getById,
	create,
	update,
	updateStatus,
	softDelete,
	hardDelete,
	getStudentProfile,
	transferStudent,
	removeStudentFromGroup,
};