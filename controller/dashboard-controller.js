import pool from "../lib/db.js";

class dashboardController {
	async getMonthlyIncome(req, res) {
		const { from, to } = req.query;

		const result = await pool.query(
			`SELECT date_trunc('month', paid_at) AS month, SUM(amount) AS total_income FROM payments WHERE paid_at BETWEEN $1 AND $2 GROUP BY month ORDER BY month
    `,
			[
				from,
				to.slice(5, 10) == "02-31"
					? to.slice(0, 5) + "02-28"
					: to.slice(0, 5) + "02-31",
			],
		);

		res.json(result.rows);
	}
	async getTopDebtors(req, res) {
		const { month } = req.query;

		const result = await pool.query(
			`SELECT s.id AS student_id, s.full_name,
         COALESCE(SUM(g.price), 0) AS should_pay,
         COALESCE(SUM(p.amount), 0) AS paid,
         COALESCE(SUM(g.price), 0) - COALESCE(SUM(p.amount), 0) AS debt
         FROM students s
         JOIN enrollments e ON e.student_id = s.id
         JOIN groups g ON g.id = e.group_id
         LEFT JOIN payments p
         ON p.student_id = s.id
         AND date_trunc('month', p.paid_at) = date_trunc('month', $1::date)
         WHERE date_trunc('month', e.joined_at) <= date_trunc('month', $1::date) AND s.status = 'ACTIVE'
         GROUP BY s.id
         HAVING COALESCE(SUM(g.price), 0) - COALESCE(SUM(p.amount), 0) > 0
         ORDER BY debt DESC LIMIT 10;
`,
			[month],
		);

		res.json(result.rows);
	}
	async getTodayLessons(req, res) {
		const result = await pool.query(`SELECT
  g.id,
  g.name AS group_name,
  g.lesson_time,
  g.lesson_days,
  g.course_type,
  t.full_name AS teacher_name,
  COUNT(e.student_id) AS students_count
   FROM groups g
   LEFT JOIN teachers t ON t.id = g.teacher_id
   LEFT JOIN enrollments e ON e.group_id = g.id
   WHERE
   (
      (extract(dow from CURRENT_DATE) = 1 AND 'Mon' = ANY(g.lesson_days)) OR
      (extract(dow from CURRENT_DATE) = 2 AND 'Tue' = ANY(g.lesson_days)) OR
      (extract(dow from CURRENT_DATE) = 3 AND 'Wed' = ANY(g.lesson_days)) OR
      (extract(dow from CURRENT_DATE) = 4 AND 'Thu' = ANY(g.lesson_days)) OR
      (extract(dow from CURRENT_DATE) = 5 AND 'Fri' = ANY(g.lesson_days)) OR
      (extract(dow from CURRENT_DATE) = 6 AND 'Sat' = ANY(g.lesson_days)) OR
      (extract(dow from CURRENT_DATE) = 0 AND 'Sun' = ANY(g.lesson_days))
   )
   AND g.status = 'ACTIVE'
   GROUP BY g.id, t.full_name
   ORDER BY g.lesson_time;
`);
		res.json(result.rows);
	}
	async getAbsentStudents(req, res) {
		const { groupId } = req.params;

		const query = `
    SELECT * FROM students s
    JOIN enrollments e ON s.id = e.student_id
    LEFT JOIN attendance a ON s.id = a.student_id 
      AND a.group_id = e.group_id 
      AND a.date = CURRENT_DATE
    WHERE e.group_id = $1
      AND (a.status IS NULL OR a.status = false)
    ORDER BY s.full_name
  `;

		try {
			const result = await pool.query(query, [groupId]);
			res.json(result.rows);
		} catch (err) {
			console.error(err);
			res.status(500).json({ msg: "Xatolik yuz berdi",err });
		}
	}
}
export default new dashboardController();
