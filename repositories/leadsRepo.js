import pool from "../lib/db.js";

async function create(data) {
	const { full_name, phone, source, interested_course, comment } = data;
	await pool.query(
		"INSERT INTO leads (full_name, phone, source, interested_course, comment) VALUES ($1, $2, $3, $4, $5)",
		[full_name, phone, source, interested_course, comment],
	);
	return { message: "Lead created successfully" };
}
async function getAll() {
	const { rows } = await pool.query(
		`SELECT * FROM leads WHERE status != 'CONVERTED' ORDER BY created_at DESC;`,
	);
	return rows;
}
async function getById(id) {
	const { rows } = await pool.query(
		`SELECT * FROM leads WHERE AND id = $1;`,
		[id],
	);
	return rows;
}
async function update(data) {
	const { full_name, phone, id } = data;
	const { rows } = await pool.query(
		`UPDATE leads SET fullname = $1, phone = $2 WHERE id = $3;`,
		[, full_name, phone, id],
	);
	return rows;
}
async function convert(leadId, group_id) {
	await pool.query("BEGIN");

	const studentResult = await pool.query(
		`INSERT INTO students (full_name, phone, status) SELECT full_name, phone, 'ACTIVE' FROM leads WHERE id = $1 RETURNING id;`,
		[leadId],
	);

	if (studentResult.rowCount === 0) {
		throw new Error("Lead not found");
	}

	const studentId = studentResult.rows[0].id;

	await pool.query(
		`INSERT INTO enrollments (student_id, group_id, status, joined_at) VALUES ($1, $2, 'ACTIVE', NOW());`,
		[studentId, group_id],
	);

	await pool.query(
		`UPDATE leads SET status = 'CONVERTED', updated_at = NOW() WHERE id = $1;`,
		[leadId],
	);

	await pool.query("COMMIT");
	return {
		student_id: studentId,
	};
}
async function deleteById(id) {
   await pool.query("UPDATE leads SET status = 'DELETED' WHERE id = $1", [id]);
}

export default {
	create,
	getAll,
   getById,
   update,
	convert,
	deleteById,
};
