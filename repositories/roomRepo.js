import pool from "../lib/db.js";

async function create(name, capacity) {
	const { rows } = await pool.query(
		`INSERT INTO rooms (name, capacity) VALUES ($1,$2), RETURNING *`,
		[name, capacity],
	);

	return rows;
}
async function get() {
	const { rows } = await pool.query(
		`SELECT r.name AS room_name, r.capacity, r.status, g.name AS group_name, g.lesson_time, g.lesson_days FROM rooms r LEFT JOIN groups g ON r.id = g.room_id AND LOWER(TO_CHAR(CURRENT_DATE, 'Dy')) = ANY(g.lesson_days) ORDER BY r.name, g.lesson_time;`,
	);

	return rows;
}

async function getById(id) {
	const { rows } = await pool.query(
		`SELECT r.name AS room_name, r.capacity, r.status, g.name AS group_name, g.lesson_time, g.lesson_days FROM rooms r LEFT JOIN groups g ON r.id = g.room_id AND LOWER(TO_CHAR(CURRENT_DATE, 'Dy')) = ANY(g.lesson_days) WHERE r.id = $1 ORDER BY r.name, g.lesson_time;`,
		[id],
	);

	return rows;
}
async function update(name, capacity, id) {
	const { rows } = await pool.query(
		`UPDATE rooms set name = $1, capacity = $2 where id = $3 RETURNING *`,
		[name, capacity, id],
	);

	return rows;
}
async function deleteById(id) {
	const { rows } = await pool.query(
		`UPDATE rooms set status = 'ARCHIVE' where id = $3 RETURNING *`,
		[id],
	);

	return rows;
}
export default { create, get, getById, deleteById, update };
