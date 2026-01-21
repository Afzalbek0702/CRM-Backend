import pool from "../lib/db.js";

class dashboardController {
	async getMonthlyIncome(req, res) {
		const { from, to } = req.query;

		const result = await pool.query(
			`
    SELECT
      date_trunc('month', paid_at) AS month,
      SUM(amount) AS total_income
    FROM payments
    WHERE paid_at BETWEEN $1 AND $2
    GROUP BY month
    ORDER BY month
    `,
			[from, to],
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
         WHERE date_trunc('month', e.joined_at) <= date_trunc('month', $1::date)
         GROUP BY s.id
         HAVING COALESCE(SUM(g.price), 0) - COALESCE(SUM(p.amount), 0) > 0
         ORDER BY debt DESC LIMIT 10;
`,
			[month],
		);

		res.json(result.rows);
	}
}
export default new dashboardController();
