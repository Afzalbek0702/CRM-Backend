import attendanceRepo from "../repositories/attendanceRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function setAttendance(req, res) {
	const { group_id, student_id, lesson_date, status } = req.body;
	if (!group_id || !student_id || !lesson_date || status === undefined)
		sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);

	try {
		const data = await attendanceRepo.set({
			group_id,
			student_id,
			lesson_date,
			status,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Davomat qo'shishda xatolik yuz berdi", 500, error);
	}
}
export async function getAttendance(req, res) {
	const { group_id, month } = req.query;

	if (!group_id || !month) {
		return res.status(400).json({ error: "group_id va month majburiy" });
	}

	// Month formatini to'g'rilash
	const [year, mon] = month.split("-");
	const normalizedMonth = `${year}-${mon.padStart(2, "0")}`;

	try {
		// Guruhdagi dars kunlarini olish
		const groupResult = await attendanceRepo.group(group_id);

		if (groupResult?.rows?.length === 0)
			return sendError(res, "Guruh topilmadi", 404);
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

		const studentsResult = await attendanceRepo.student(group_id);

		const attendanceData = [];

		for (const student of studentsResult.rows) {
			const days = [];

			for (let day = 1; day <= 31; day++) {
				const dateStr = `${normalizedMonth}-${day.toString().padStart(2, "0")}`;
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
				const attendanceResult = await attendanceRepo.attendance(
					student.id,
					group_id,
					dateStr,
				);

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
		sendSuccess(res, attendanceData);
	} catch (err) {
		sendError(res, "Internal server error", 500, err);
	}
}
