import { sendSMS } from "../services/eskiz.service.js";

export const sendDebtReminder = async (req, res) => {
	const { student_id, debt_amount, full_name, phone } = req.body;

	// Xabar matni
	const message = `Hurmatli ${full_name}, Sizning o'quv markazimizdan ${debt_amount.toLocaleString()} so'm miqdorida qarzingiz bor. Iltimos, to'lovni amalga oshirishingizni so'raymiz.`;

	try {
		// SMS provayderiga yuborish
		const result = await sendSMS(phone, message);

		if (result.success) {
			res
				.status(200)
				.json({ success: true, message: "SMS muvaffaqiyatli yuborildi" });
		} else {
			res.status(400).json({ error: "SMS yuborishda xatolik yuz berdi" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
