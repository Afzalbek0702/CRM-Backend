import attendanceService from "../services/attendance.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAttendance(req, res) {
	const { group_id, month } = req.query; // format: 2024-05
	if (!group_id || !month)
		return sendError(res, "group_id, month Parametrlar yetarli emas", 400);

	try {
		const [year, mon] = month.split("-").map(Number);
		const startDate = `${month}-01`;
		const endDate = `${month}-${new Date(year, mon, 0).getDate()}`;

		const [group, students, allAttendance] = await Promise.all([
			attendanceService.getGroupDetails(group_id, req.tenantId),
			attendanceService.getStudentsInGroup(group_id, req.tenantId),
			attendanceService.getMonthlyAttendance(
				group_id,
				startDate,
				endDate,
				req.tenantId,
			),
		]);

		if (!group) return sendError(res, "Guruh topilmadi", 404);

		const dayNameToNumber = {
			Sun: 0,
			Mon: 1,
			Tue: 2,
			Wed: 3,
			Thu: 4,
			Fri: 5,
			Sat: 6,
		};
		const numericLessonDays = group.lesson_days.map((d) =>
			typeof d === "string" ? dayNameToNumber[d] : d,
		);

		const attendanceData = students.map((student) => {
			const studentDays = [];
			const lastDay = new Date(year, mon, 0).getDate();

			for (let day = 1; day <= lastDay; day++) {
				const dateObj = new Date(year, mon - 1, day);
				const dayOfWeek = dateObj.getDay(); // 0 (Sun) - 6 (Sat)

				const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
				const isLessonDay =
					numericLessonDays.includes(dayOfWeek) ||
					numericLessonDays.includes(isoDay);

				if (isLessonDay) {
					const dateStr = `${month}-${day.toString().padStart(2, "0")}`;

					// Bazadan olingan massivdan qidiramiz (Tsikl ichida so'rov yo'q!)
					const record = allAttendance.find(
						(a) =>
							a.student_id === student.id &&
							a.lesson_date.toISOString().split("T")[0] === dateStr,
					);

					studentDays.push({
						date: dateStr,
						isLessonDay,
						status: record ? record.status : null,
					});
				}
			}

			return {
				student_id: student.id,
				full_name: student.full_name,
				days: studentDays,
			};
		});

		sendSuccess(res, attendanceData);
	} catch (err) {
		sendError(res, "Server xatosi", 500, err.message);
	}
}

export async function setAttendance(req, res) {
	const { group_id, student_id, lesson_date, status } = req.body;
	if (!group_id || !student_id || !lesson_date || status === undefined)
		sendError(
			res,
			"Barcha maydonlar to'ldirilishi kerak! group_id, student_id, lesson_date, status",
			400,
		);

	try {
		// Service ichidagi upsert mantiqi ishlaydi
		const data = await attendanceService.set({
			group_id,
			student_id,
			lesson_date,
			status,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Server xatosi", 500, error);
	}
}
