import pool from "../lib/db.js";

class Groups_Controller {
	async getAllGroups(req, res) {
		try {
			const { rows } = await pool.query(
				`SELECT g.id, g.name, g.price, g.course_type, g.lesson_time, g.lesson_days, g.status,t.id AS teacher_id, t.full_name AS teacher FROM groups g JOIN teachers t ON t.id = g.teacher_id WHERE g.status = 'ACTIVE';`,
			);
			res.json(rows);
		} catch (error) {
			res.status(500).json({ msg: "Guruhlarni olishda xatolik yuz berdi", error });
		}
	}
	async createGroup(req, res) {
		const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
			req.body;
		if (
			!name ||
			!course_type ||
			!price ||
			!lesson_time ||
			!lesson_days ||
			!teacher_id
		) {
			return res
				.status(400)
				.json({ error: "Barcha maydonlar to'ldirilishi kerak" });
		}
		try {
			const { rows } = await pool.query(
				`INSERT INTO groups (name, course_type, price, lesson_time, lesson_days, teacher_id) VALUES ($1, $2, $3, $4, $5, $6)RETURNING *;`,
				[name, course_type, price, lesson_time, lesson_days, teacher_id]
			);
			res.json(rows[0]);
		} catch (error) {
			res.status(500).json({ msg: "Guruh yaratishda xatolik yuz berdi", error });
		}
	}
	async getSingleGroup(req, res) {
		if (!req.params.id)
			return res.status(400).json({ error: "Guruh ID si ko'rsatilmagan" });
		try {
			const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [
				req.params.id,
			]);
			res.json(rows[0]);
		} catch (error) {
			res.status(500).json({ msg: "Guruhni olishda xatolik yuz berdi", error });
		}
	}
	async getStudentsInGroup(req, res) {
		if (!req.params.id)
			return res.status(400).json({ error: "Guruh ID si ko'rsatilmagan" });
		try {
			const { rows } = await pool.query(
				`SELECT s.id, s.full_name, s.phone FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.group_id = $1 AND e.status = 'ACTIVE'`,
				[req.params.id]
			);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchilarni olishda xatolik yuz berdi", error });
		}
	}
	async updateGroup(req, res) {
		const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
			req.body;
		if (
			!name ||
			!course_type ||
			!price ||
			!lesson_time ||
			!lesson_days ||
			!teacher_id
		) {
			return res
				.status(400)
				.json({ error: "Barcha maydonlar to'ldirilishi kerak" });
		}
		try {
			const { rows } = await pool.query(
				`UPDATE groups SET name = $1, course_type = $2, price = $3, lesson_time = $4, lesson_days = $5, teacher_id = $6 WHERE id = $7 RETURNING *;`,
				[
					name,
					course_type,
					price,
					lesson_time,
					lesson_days,
					teacher_id,
					req.params.id,
				]
			);
			res.json(rows[0]);
		} catch (error) {
			res.status(500).json({ msg: "Guruhni yangilashda xatolik yuz berdi", error });
		}
	}
	async deleteGroup(req, res) {
		if (!req.params.id) {
			return res.status(400).json({ error: "Guruh ID si ko'rsatilmagan" });
		}
		try {
			const groupResult = await pool.query(
				`UPDATE groups SET status = 'ARCHIVED' WHERE id = $1 RETURNING *`,
				[req.params.id],
			);

			const enrollmentsResult = await pool.query(
				`UPDATE enrollments SET status = 'FINISHED', end_date = CURRENT_DATE WHERE group_id = $1 RETURNING *`,
				[req.params.id],
			);
			res.json({
				group: groupResult.rows[0],
				updatedEnrollments: enrollmentsResult.rows,
				enrollmentCount: enrollmentsResult.rowCount,
			});
		} catch (error) {
			res.status(500).json({ msg: "Guruhni o'chirishda xatolik yuz berdi", error });
		}
	}
}
export default new Groups_Controller();