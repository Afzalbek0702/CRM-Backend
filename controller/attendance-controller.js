import pool from "../lib/db.js";

class attendanceController {
	async setAttendance(req, res) {
		const { group_id, student_id, lesson_date, status } = req.body;
		if (!group_id || !student_id || !lesson_date || status === undefined) {
			return res
				.status(400)
				.json({ error: "Barcha maydonlar to'ldirilishi kerak" });
		}
		try {
			const { rows } = await pool.query(
				`INSERT INTO attendance (group_id, student_id, lesson_date, status)
         VALUES ($1, $2, $3, $4) ON CONFLICT (group_id, student_id, lesson_date)
         DO UPDATE SET status = $4
         RETURNING *
    `,
				[group_id, student_id, lesson_date, status]
			);
			res.json(rows[0]);
		} catch (error) {
			res.status(500).json({ msg: "Davomat qo'shishda xatolik yuz berdi", error });
		}
	}
	async getAttendance(req, res) {
		const { group_id, month } = req.query;

		if (!group_id || !month) {
			return res.status(400).json({ error: "group_id va month majburiy" });
		}

		// Month formatini to'g'rilash
		const [year, mon] = month.split("-");
		const normalizedMonth = `${year}-${mon.padStart(2, "0")}`;

		try {
			// Guruhdagi dars kunlarini olish
			const groupQuery = `SELECT lesson_days FROM groups WHERE id = $1`;
			const groupResult = await pool.query(groupQuery, [group_id]);

			if (groupResult.rows.length === 0) {
				return res.status(404).json({ error: "Guruh topilmadi" });
			}

			const lessonDays = groupResult.rows[0].lesson_days; // [1,2,3] yoki ["Tue", "Thu"]

			// lesson_days ni raqamga aylantirish
			let numericLessonDays = lessonDays;

			if (typeof lessonDays[0] === "string") {
				const dayNameToNumber = {
					Sun: 1,
					Mon: 2,
					Tue: 3,
					Wed: 4,
					Thu: 5,
					Fri: 6,
					Sat: 7,
				};
				numericLessonDays = lessonDays
					.map((name) => dayNameToNumber[name])
					.filter(Boolean);
			}

			// Guruhdagi o'quvchilarni olish
			const studentsQuery = `SELECT s.id, s.full_name FROM students s JOIN enrollments e ON s.id = e.student_id WHERE e.group_id = $1 AND e.status = 'ACTIVE' ORDER BY s.full_name`;
			const studentsResult = await pool.query(studentsQuery, [group_id]);

			const attendanceData = [];

			for (const student of studentsResult.rows) {
				const days = [];

				for (let day = 1; day <= 31; day++) {
					const dateStr = `${normalizedMonth}-${day
						.toString()
						.padStart(2, "0")}`;
					const dateObj = new Date(dateStr);

					if (isNaN(dateObj.getTime())) continue;

					const monthCheck =
						dateObj.getFullYear() +
						"-" +
						String(dateObj.getMonth() + 1).padStart(2, "0");
					if (monthCheck !== normalizedMonth) break;

					const dayOfWeek = dateObj.getDay();
					const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;

					const isLessonDay = numericLessonDays.includes(isoDay);

					// Debug
					// console.log(
					// 	`San: ${dateStr}, ISO: ${isoDay}, IsLessonDay: ${isLessonDay}`
					// );

					// Davomatni olish (to'g'ri ustun nomi ishlatilishi kerak)
					const attendanceQuery = `SELECT status FROM attendance WHERE student_id = $1 AND group_id = $2 AND lesson_date = $3`;
					const attendanceResult = await pool.query(attendanceQuery, [
						student.id,
						group_id,
						dateStr,
					]);

					if (isLessonDay) {
						days.push({
							date: dateStr,
							dayOfWeek: isoDay,
							isLessonDay,
							status: attendanceResult.rows[0]?.status ?? null,
						});
					}
				}

				// console.log(
				// 	`Talaba: ${student.full_name}, Days uzunligi: ${days.length}`
				// );

				attendanceData.push({
					student_id: student.id,
					full_name: student.full_name,
					days: days,
				});
			}

			res.json(attendanceData);
		} catch (err) {
			console.error("getAttendance xatosi:", err.message);
			res.status(500).json({ error: "Server xatosi", details: err.message });
		}
	}
}
export default new attendanceController();