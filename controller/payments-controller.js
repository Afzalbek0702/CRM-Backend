import pool from "../lib/db.js";
class PaymentsController {
	async getAllPayments(req, res) {
		try {
			const { rows } =
				await pool.query(`SELECT p.id, p.amount, p.paid_at, p.paid_month, p.method, s.full_name AS student_name, g.name AS group_name FROM payments p JOIN students s ON s.id = p.student_id JOIN groups g ON g.id = p.group_id ORDER BY p.paid_at DESC;
`);
			res.json(rows);
		} catch (error) {
			res
				.status(500)
				.json({ msg: "Paymentsni olishda xatolik yuz berdi", error });
		}
	}
	async createPayment(req, res) {
		const { student_id, group_id, amount, method, paid_month } = req.body;
		if (!student_id || !group_id || !amount || !method || !paid_month) {
			return res
				.status(400)
				.json({ error: "Barcha maydonlar to'ldirilishi kerak" });
		}
		try {
			const { rows } = await pool.query(
				"INSERT INTO payments (student_id, group_id, amount, method, paid_month) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
				[student_id, group_id, amount, method, paid_month]
			);
			res.json(rows[0]);
      } catch (error) {
         console.log(error);
         
			res.status(500).json({ msg: "To'lov yaratishda xatolik yuz berdi", error });
		}
	}
	async getPaymentById(req, res) {
		if (!req.params.id)
			return res.status(400).json({ error: "ID maydoni to'ldirilishi kerak" });
		try {
			const { rows } = await pool.query(
				"SELECT * FROM payments WHERE id = $1;",
				[req.params.id]
			);
			res.json(rows[0]);
		} catch (error) {
			res.status(500).json({ msg: "To'lovni olishda xatolik yuz berdi", error });
		}
	}
	async updatePayment(req, res) {
		if (!req.params.id)
			return res.status(400).json({ error: "ID maydoni to'ldirilishi kerak" });
		const { student_id, group_id, amount, type, paid_month } = req.body;
		if (!student_id || !group_id || !amount || !type || !paid_month) {
			return res
				.status(400)
				.json({ error: "Barcha maydonlar to'ldirilishi kerak" });
		}
		try {
			const { rows } = await pool.query(
				"UPDATE payments SET student_id = $1, group_id = $2, amount = $3, type = $4, paid_month = $5 WHERE id = $6 RETURNING *;",
				[student_id, group_id, amount, type, paid_month, req.params.id]
			);
			res.json(rows[0]);
		} catch (error) {
			res.status(500).json({ msg: "To'lovni yangilashda xatolik yuz berdi", error });
		}
	}

	async deletePayment(req, res) {
		if (!req.params.id)
			return res.status(400).json({ error: "ID maydoni to'ldirilishi kerak" });
		try {
			await pool.query("DELETE FROM payments WHERE id = $1;", [req.params.id]);
			res.json({ message: "Payment mufaqqiyatli o'chirildi" });
		} catch (error) {
			res.status(500).json({ msg: "To'lovni o'chirishda xatolik yuz berdi", error });
		}
	}
}
export default new PaymentsController();
