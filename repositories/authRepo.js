import pool from "../lib/db.js";

// async function create(data) {
// 	const { username, phone, hash, role } = data;
// 	const { rows } = await pool.query(
// 		`INSERT INTO users (username, phone, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, username, role`,
// 		[username, phone, hash, role],
// 	);
// 	return rows[0];
// }
// async function get(username) {
// 	const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [
// 		username,
// 	]);
// 	return rows[0];
// }
async function userCreate(phone, hash, position) {
	const { rows } = await pool.query(
		`
      INSERT INTO users (phone, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
		[phone, hash, position],
	);
	return rows;
}
async function workerCreate(data) {
	const { userId, full_name, phone, position, salary, birthday, img } = data;
	const { rows } = await pool.query(
		`
      INSERT INTO workers
      (user_id, full_name, phone, position, salary, birthday, img)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
		[userId, full_name, phone, position, salary, birthday, img],
	);
	return rows;
}
async function checkLogin(phone) {
	const result = await pool.query(
		`
       SELECT u.id, u.password_hash, u.role, w.full_name
       FROM users u
       JOIN workers w ON w.user_id = u.id
       WHERE u.phone = $1 AND u.status = 'ACTIVE'`,
		[phone],
	);
	return result;
}

export default { userCreate, workerCreate,checkLogin };
