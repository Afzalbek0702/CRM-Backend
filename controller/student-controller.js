import pool from "../lib/db.js";

class Student_Controller {
	async getAllStudents(req, res) {
		try {
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
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchilarni olishda xatolik yuz berdi", error });
		}
	}
	async getSingleStudents(req, res) {
		if (!req.params.id) {
			return res.status(400).json({ error: "ID kerak" });
		}
		try {
			const { rows } = await pool.query(
				"SELECT * FROM students WHERE id = $1;",
				[req.params.id],
			);
			res.json(rows[0]);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchini olishda xatolik yuz berdi", error });
		}
	}
	async postStudent(req, res) {
		const { full_name, phone, birthday, parents_name, parents_phone } = req.body;
		if (!full_name || !phone || !birthday || !parents_name || !parents_phone) {
			return res
				.status(400)
				.json({ error: "full_name, phone, birthday, parents_name va parents_phone kerak" });
		}
		try {
			const { rows } = await pool.query(
				"INSERT INTO students (full_name, phone, birthday, parents_name, parents_phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
				[full_name, phone, birthday, parents_name, parents_phone],
			);
			res.json(rows[0]);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchini qo'shishda xatolik yuz berdi", error });
		}
	}
	async updateStudent(req, res) {
		if (!req.params.id) {
			return res.status(400).json({ error: "ID kerak" });
		}
		const { full_name, phone, birthday, parents_name } = req.body;
		if (!full_name || !phone || !birthday || !parents_name) {
			return res
				.status(400)
				.json({ error: "full_name, phone, birthday va parents_name kerak" });
		}
		try {
			const { rows } = await pool.query(
				"UPDATE students SET full_name = $1, phone = $2, birthday = $3, parents_name = $4 WHERE id = $5 RETURNING *",
				[full_name, phone, birthday, parents_name, req.params.id],
			);
			res.json(rows[0]);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchini yangilashda xatolik yuz berdi", error });
		}
	}
	async updateStudentStatus(req, res) {
		const { status } = req.body;
		if (!req.params.id || !status) {
			return res.status(400).json({ error: "ID va status kerak" });
		}

		const allowed = ["active", "frozen", "finished", "debtor"];
		if (!allowed.includes(status)) {
			return res.status(400).json({ message: "Noto‘g‘ri status" });
		}
		try {
			await pool.query("UPDATE students SET status = $1 WHERE id = $2", [
				status,
				req.params.id,
			]);

			res.json({ message: "Status yangilandi" });
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchini yangilashda xatolik yuz berdi", error });
		}
	}
	async deleteStudent(req, res) {
		if (!req.params.id) {
			return res.status(400).json({ error: "ID kerak" });
		}
		try {
			const { rows } = await pool.query(
				`UPDATE students SET status = 'DELETED', deleted_at = NOW() WHERE id = $1 RETURNING *`,
				[req.params.id],
			);
			res.json(rows[0]);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchini o'chirishda xatolik yuz berdi", error });
			console.log(error);
		}
	}
	async getStudentProfile(req, res) {
		const { id } = req.params;

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

		res.json({
			student: student.rows[0],
			attendance: attendance.rows,
			payments: payments.rows,
		});
	}
	async transferStudent(req, res) {
		const { student_id, from_group_id, to_group_id } = req.body;
		console.log(student_id, from_group_id, to_group_id);

		if (!student_id || !from_group_id || !to_group_id) {
			return res
				.status(400)
				.json({ error: "student_id, from_group_id va to_group_id kerak" });
		}
		try {
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

			res.json({ msg: "O'quvchi muvaffaqiyatli ko'chirildi" });
		} catch (error) {
			res
				.status(500)
				.json({ msg: "O'quvchini ko'chirishda xatolik yuz berdi", error });
			console.log(error);
		}
	}
	async removeStudentFromGroup(req, res) {
		const studentId = req.params.id;
		const { groupId } = req.body;

		if (!groupId) {
			return res.status(400).json({ msg: "groupId kerak!" });
		}
		try {
			await pool.query("BEGIN");

			const result = await pool.query(
				`UPDATE enrollments SET status = 'ARCHIVED', archived_at = NOW() WHERE student_id = $1 AND group_id = $2 AND status = 'ACTIVE' RETURNING *;`,
				[studentId, groupId],
			);

			if (result.rowCount === 0) {
				return res.status(404).json({ msg: "Active enrollment not found" });
			}

			await pool.query("COMMIT");
			res.json({
				msg: "Student muvaffaqiyatli guruhdan o'chirildi",
				enrollment: result.rows[0],
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({ msg: "Server error", error: err });
		} finally {
			pool.release();
		}
	}
}

export default new Student_Controller();
