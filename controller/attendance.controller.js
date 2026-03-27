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

		// O'quvchining guruhga qo'shilgan sanasi
		const rawJoinedAt = student.enrollments[0]?.joined_at;
		const joinDate = rawJoinedAt ? new Date(rawJoinedAt) : null;
		if (joinDate) joinDate.setHours(0, 0, 0, 0);

		for (let day = 1; day <= lastDay; day++) {
			const dateObj = new Date(year, mon - 1, day);
			const dayOfWeek = dateObj.getDay();
			const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
			const isLessonDay =
				numericLessonDays.includes(dayOfWeek) ||
				numericLessonDays.includes(isoDay);

			if (isLessonDay) {
				const dateStr = `${month}-${day.toString().padStart(2, "0")}`;

				// 1. O'quvchi qo'shilgan sanadan oldingi kunmi?
				const isBeforeJoined = joinDate && dateObj < joinDate;

				let currentStatus = null;

				if (isBeforeJoined) {
					// Hali guruhda bo'lmagan davri uchun maxsus status
					currentStatus = "NOT_ENROLLED";
				} else {
					// Bazadan davomatni qidiramiz
					const record = allAttendance.find(
						(a) =>
							a.student_id === student.id &&
							a.lesson_date.toISOString().split("T")[0] === dateStr,
					);
					currentStatus = record ? record.status : null;
				}

				studentDays.push({
					date: dateStr,
					isLessonDay,
					status: currentStatus,
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
	const data = req.body;

	try {
		// 1. Agar massiv kelsa (Ommaviy saqlash)
		if (Array.isArray(data)) {
			const results = await Promise.all(
				data.map((item) =>
					attendanceService.set({
						...item,
						tenant_id: req.tenantId,
					}),
				),
			);
			return sendSuccess(res, results, 200);
		}

		// 2. Agar bitta ob'ekt kelsa (Eski usul)
		const { group_id, student_id, lesson_date, status } = data;
		if (!group_id || !student_id || !lesson_date || status === undefined) {
			return sendError(res, "Parametrlar yetarli emas", 400);
		}

		const result = await attendanceService.set({
			group_id,
			student_id,
			lesson_date,
			status,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, result);
	} catch (error) {
		sendError(res, "Server xatosi", 500, error.message);
	}
}
