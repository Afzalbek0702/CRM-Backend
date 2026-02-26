export function parseLessonTime(range) {
	if (!range) {
		throw new Error("lesson_time bo‘sh");
	}

	// bo‘sh joylarni tozalaymiz
	const cleaned = range.replace(/\s+/g, "");

	// 9:00-11:00 | 09:00-11:00
	const match = cleaned.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);

	if (!match) {
		throw new Error("lesson_time noto‘g‘ri formatda");
	}

	const [, start, end] = match;

	return {
		start: timeToMinutes(start),
		end: timeToMinutes(end),
	};
}
function timeToMinutes(time) {
	// "HH:MM" -> number
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}
export function isTimeOverlap(aStart, aEnd, bStart, bEnd) {
	return aStart < bEnd && aEnd > bStart;
}