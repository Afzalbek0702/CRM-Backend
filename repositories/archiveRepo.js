import pool from "../lib/db.js";

async function getPayments() {
	const { rows } = await pool.query(
		`SELECT p.id, p.amount, p.paid_at, p.paid_month, p.method, s.full_name AS student_name, g.name AS group_name FROM payments p JOIN students s ON s.id = p.student_id JOIN groups g ON g.id = p.group_id WHERE p.status = 'DELETED' ORDER BY p.paid_at DESC;`,
	);
	return rows;
}
async function getLeads() {
	const { rows } = await pool.query(
		`SELECT * FROM leads WHERE status = 'DELETED' ORDER BY created_at DESC;`,
	);
	return rows;
}
async function getGroups() {
	const { rows } = await pool.query(
		`SELECT * FROM groups WHERE status = 'ARCHIVED' ORDER BY created_at DESC;`,
	);
	return rows;
}
async function getGroupById(id) {
	const { rows } = await pool.query(
		`SELECT * FROM groups WHERE id = $1 AND status = 'ARCHIVED';`,
		[id],
	);
	return rows;
}
async function getGroupsStudents() {
	const { rows } = await pool.query(`SELECT e.id,
  s.full_name AS student_name,
  g.name AS group_name,
  e.archived_at
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN groups g ON g.id = e.group_id
WHERE e.status = 'ARCHIVED'
ORDER BY e.archived_at DESC;`);
	return rows;
}
async function getStudents() {
	const { rows } = await pool.query(
		`SELECT * FROM students WHERE status = 'DELETED' ORDER BY created_at DESC;`,
	);
	return rows;
}
async function getTeachers() {
	const { rows } = await pool.query(
		`SELECT * FROM teachers WHERE status = 'DELETED'`,
	);
	return rows;
}
export default {
	getGroupById,
	getGroups,
	getGroupsStudents,
	getLeads,
	getPayments,
	getStudents,
	getTeachers,
};
