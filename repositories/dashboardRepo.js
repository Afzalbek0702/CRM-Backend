import pool from "../lib/db.js";

async function MonthlyIncome(from, to) {
	const { rows } = await pool.query(
		`SELECT date_trunc('month', paid_at) AS month, SUM(amount) AS total_income FROM payments WHERE paid_at BETWEEN $1 AND $2 GROUP BY month ORDER BY month`,
		[
			from,
			to.slice(5, 10) == "02-31"
				? to.slice(0, 5) + "02-28"
				: to.slice(0, 5) + "02-31",
		],
	);

	return rows;
}
async function TopDebtors(month) {
	const { rows } = await pool.query(
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

	return rows;
}
async function TodayLessons() {
	const { rows } = await pool.query(`SELECT
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
	return rows;
}
async function AbsentStudents() {
	const query = `SELECT 
      g.name AS group_name,
      s.id AS student_id,
      s.full_name,
      s.phone,
      s.parents_name,
      s.parents_phone
      FROM groups g
      JOIN enrollments e ON g.id = e.group_id
      JOIN students s ON e.student_id = s.id
      LEFT JOIN attendance a ON s.id = a.student_id 
      AND a.group_id = g.id 
      AND a.lesson_date = CURRENT_DATE
      WHERE LOWER(TO_CHAR(CURRENT_DATE, 'Dy')) = ANY(
      SELECT LOWER(unnest(g.lesson_days)))
      AND SPLIT_PART(g.lesson_time, ' - ', 1)::TIME <= CURRENT_TIME
      AND (a.status IS NULL OR a.status = false) 
      AND s.status = 'ACTIVE' AND g.status = 'ACTIVE'
      ORDER BY g.name, s.full_name`;

	const { rows } = await pool.query(query);
	return rows;
}
export default { AbsentStudents, MonthlyIncome, TodayLessons, TopDebtors };
