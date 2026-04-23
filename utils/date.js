import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
export function getMonthRange(date) {
	// Berilgan sanani UTC rejimiga o'tkazamiz
	const d = dayjs(date).utc(true);

	// Oy boshi (UTC 00:00:00)
	const start = d.startOf("month").toDate();

	// Keyingi oy boshi (UTC 00:00:00)
	const nextStart = d.add(1, "month").startOf("month").toDate();

	// Oy oxiri
	const end = d.endOf("month").toDate();

	return { start, end, nextStart };
}

export function formatDateForDB(date) {
	// Bu funksiya sizga Prisma uchun "Sana 00:00:00 UTC" holatida Date obyektini qaytaradi
	return dayjs(date).utc(true).startOf("day").toDate();
}

export function calculateProratedFee(fullPrice, joinDate, monthEnd) {
	// Sanalarni UTC rejimiga o'tkazamiz
	const start = dayjs.utc(joinDate);
	const end = dayjs.utc(monthEnd);

	// Oyning birinchi kunini hisoblaymiz
	const monthStart = start.startOf("month");

	// Jami kunlar (Oy boshidan oxirigacha)
	// +1 qo'shishimizning sababi: diff faqat farqni hisoblaydi, kunning o'zini ham sanash uchun +1 kerak
	const totalDays = end.diff(monthStart, "day") + 1;

	// Qolgan kunlar (Qo'shilgan kundan oxirigacha)
	const daysRemaining = end.diff(start, "day") + 1;

	// Agar sana o'tib ketgan bo'lsa yoki noto'g'ri bo'lsa
	if (daysRemaining <= 0) return 0;

	// Prorated hisob-kitob
	const fee = (fullPrice / totalDays) * daysRemaining;

	return Number(fee.toFixed(2)); // 2 ta kasr raqamigacha yaxlitlash
}
// --- Test ---
// const nextStart = dayjs("2026-05-01").utc(true).startOf('day').toDate();

// console.log("Prisma uchun tayyor Date (ISO):", nextStart.toISOString());
// Natija: 2026-05-01T00:00:00.000Z <-- Endi aynan 1-may bo'ladi!

// --- Test qilish ---
// const now = new Date(); // 2026-04-22
// const { start, end, nextStart } = getMonthRange(now);

// console.log("Hozirgi vaqt:", dayjs(now).format("YYYY-MM-DD HH:mm:ss"));
// console.log("Next Start (Object):", nextStart);
// console.log("Next Start (DB Format):", formatDateForDB(nextStart));
// Natija: "2026-05-01" (Muammo hal bo'ldi!)

