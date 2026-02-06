import pool from "../lib/db.js";
class LeadsController {
	async createLead(req, res) {
		try {
			const { full_name, phone, source, interested_course, comment } = req.body;
			if (!full_name || !phone || !source || !interested_course || !comment) {
				return res
					.status(400)
					.json({
						msg: "Full name, phone, source, interested course, and comment are required",
					});
			}
			await pool.query(
				"INSERT INTO leads (full_name, phone, source, interested_course, comment) VALUES ($1, $2, $3, $4, $5)",
				[full_name, phone, source, interested_course, comment],
			);
			res.status(201).json({ msg: "Lead created successfully" });
		} catch (error) {
			res.status(500).json({ msg: "Failed to create lead", error });
		}
	}

	async getLeads(req, res) {
		try {
			const result = await pool.query(
				`SELECT * FROM leads WHERE status != 'CONVERTED' ORDER BY created_at DESC;`,
			);
			res.status(200).json(result.rows);
		} catch (error) {
			res.status(500).json({ msg: "Failed to retrieve leads", error });
		}
	}

	async convertLeadToGroup(req, res) {
		const leadId = req.params.id;
		const { group_id } = req.body;

		if (!group_id) {
			return res.status(400).json({ msg: "group_id is required" });
		}

		try {
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

			res.json({
				msg: "Lead successfully converted and added to group",
				student_id: studentId,
			});
		} catch (err) {
			await pool.query("ROLLBACK");
			console.error(err);
			res.status(500).json({ msg: "Conversion failed",err });
		} finally {
			pool.release();
		}
   }
   
   async deleteLead(req, res) {
      const leadId = req.params.id;
      try {
         await pool.query("UPDATE leads SET status = 'DELETED' WHERE id = $1", [leadId]);
         res.json({ msg: "Lead deleted successfully" });
      } catch (error) {
         res.status(500).json({ msg: "Failed to delete lead", error });
      }
   }
}
export default new LeadsController();
