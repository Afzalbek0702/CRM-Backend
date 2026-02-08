import paymentRepo from "../repositories/paymentRepo.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllPayments(req, res) {
	try {
		const payments = await paymentRepo.getAll();
		sendSuccess(res, payments, "Payments muvaffaqiyatli olindi", 200);
	} catch (error) {
		sendError(res, "Paymentsni olishda xatolik yuz berdi", 500, error);
	}
}
export async function createPayment(req, res) {
	const { student_id, group_id, amount, method, paid_month } = req.body;
	if (!student_id || !group_id || !amount || !method || !paid_month) {
		return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
	}
	try {
		const newPayment = await paymentRepo.create({
			student_id,
			group_id,
			amount,
			method,
			paid_month,
		});
		sendSuccess(res, newPayment, "Payment muvaffaqiyatli yaratildi", 201);
	} catch (error) {
		sendError(res, "Payment yaratishda xatolik yuz berdi", 500, error);
	}
}
export async function getPaymentById(req, res) {
	if (!req.params.id)
		return sendError(res, "ID maydoni to'ldirilishi kerak", 400);
	try {
		const payment = await paymentRepo.getById(req.params.id);
		if (!payment) {
			return sendError(res, "Payment topilmadi", 404);
		}
		sendSuccess(res, payment, "Payment muvaffaqiyatli olindi", 200);
	} catch (error) {
		sendError(res, "To'lovni olishda xatolik yuz berdi", 500, error);
	}
}
export async function updatePayment(req, res) {
	if (!req.params.id)
		return sendError(res, "ID maydoni to'ldirilishi kerak", 400);
	const { student_id, group_id, amount, type, paid_month } = req.body;
	if (!student_id || !group_id || !amount || !type || !paid_month) {
		return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
	}
	try {
		const updatedPayment = await paymentRepo.update(req.params.id, {
			student_id,
			group_id,
			amount,
			type,
			paid_month,
		});
		sendSuccess(res, updatedPayment, "Payment muvaffaqiyatli yangilandi", 200);
	} catch (error) {
		sendError(res, "Paymentni yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deletePayment(req, res) {
	if (!req.params.id)
		return sendError(res, "ID maydoni to'ldirilishi kerak", 400);
	try {
		await paymentRepo.deleteById(req.params.id);
		sendSuccess(res, null, "Payment muvaffaqiyatli o'chirildi", 200);
	} catch (error) {
		sendError(res, "To'lovni o'chirishda xatolik yuz berdi", 500, error);
	}
}
