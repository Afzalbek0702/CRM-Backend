import pool from "../lib/db.js";

class ArchiveController {
	async getAllArchivedPayments(req, res) {
		try {
			const { rows } = await pool.query(
				`SELECT p.id, p.amount, p.paid_at, p.paid_month, p.method, s.full_name AS student_name, g.name AS group_name FROM payments p JOIN students s ON s.id = p.student_id JOIN groups g ON g.id = p.group_id WHERE p.status = 'DELETED' ORDER BY p.paid_at DESC;`,
			);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({
					msg: "Arxivlangan to'lovlarni olishda xatolik yuz berdi",
					error,
				});
		}
	}
	async getAllArchivedLeads(req, res) {
		try {
			const { rows } = await pool.query(
				`SELECT * FROM leads WHERE status = 'DELETED' ORDER BY created_at DESC;`,
			);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({
					msg: "Arxivlangan leadlarni olishda xatolik yuz berdi",
					error,
				});
		}
	}
	async getAllArchivedGroups(req, res) {
		try {
			const { rows } = await pool.query(
				`SELECT * FROM groups WHERE status = 'ARCHIVED' ORDER BY created_at DESC;`,
			);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({
					msg: "Arxivlangan guruhlarni olishda xatolik yuz berdi",
					error,
				});
		}
	}
	async getArchivedGroupById(req, res) {
		const { id } = req.params;
		try {
			const { rows } = await pool.query(
				`SELECT * FROM groups WHERE id = $1 AND status = 'ARCHIVED';`,
				[id],
			);
			if (rows.length === 0) {
				return res.status(404).json({ msg: "Arxivlangan guruh topilmadi" });
			}
			res.json(rows[0]);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "Arxivlangan guruhni olishda xatolik yuz berdi", error });
		}
	}
	async getAllArchivedGroupsStudents(req, res) {
		try {
			const { rows } = await pool.query(`SELECT
  e.id,
  s.full_name AS student_name,
  g.name AS group_name,
  e.archived_at
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN groups g ON g.id = e.group_id
WHERE e.status = 'ARCHIVED'
ORDER BY e.archived_at DESC;`);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({
					msg: "Arxivlangan guruh o'quvchilarini olishda xatolik yuz berdi",
					error,
				});
		}
	}
	async getAllArchivedStudents(req, res) {
		try {
			const { rows } = await pool.query(
				`SELECT * FROM students WHERE status = 'DELETED' ORDER BY created_at DESC;`,
			);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({
					msg: "Arxivlangan o'quvchilarni olishda xatolik yuz berdi",
					error,
				});
		}
	}
}
export default new ArchiveController();
