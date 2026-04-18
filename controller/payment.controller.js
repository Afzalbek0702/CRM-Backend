import paymentService from "../services/payment.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllPayments(req, res) {
	try {
		const payments = await paymentService.getAll(req.tenantId);
		sendSuccess(res, payments);
	} catch (error) {
		sendError(res, "Paymentsni olishda xatolik yuz berdi", 500, error);
	}
}
export async function createPayment(req, res) {
	const { student_id, group_id, amount, method, paid_month } = req.body;
	if (!student_id || !group_id || !amount || !method || !paid_month) {
		return sendError(
			res,
			"Barcha maydonlar to'ldirilishi kerak! student_id, group_id, amount, method, paid_month",
			400,
		);
	}
	try {
		const newPayment = await paymentService.create({
			student_id,
			group_id,
			amount,
			method,
			paid_month,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, newPayment, 201);
	} catch (error) {
		sendError(res, "Payment yaratishda xatolik yuz berdi", 500, error);
	}
}
export async function getPaymentById(req, res) {
	if (!req.params.id) return sendError(res, "ID topilmadi", 400);
	try {
		const payment = await paymentService.getById(req.params.id, req.tenantId);
		sendSuccess(res, payment);
	} catch (error) {
		sendError(
			res,
			error.message || "To'lovni olishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function updatePayment(req, res) {
	if (!req.params.id) return sendError(res, "ID topilmadi", 400);
	const { student_id, group_id, amount, type, paid_month } = req.body;
	if (!student_id || !group_id || !amount || !type || !paid_month) {
		return sendError(
			res,
			"Barcha maydonlar to'ldirilishi kerak! student_id, group_id, amount, type, paid_month",
			400,
		);
	}
	try {
		const updatedPayment = await paymentService.update(req.params.id, {
			student_id,
			group_id,
			amount,
			type,
			paid_month,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, updatedPayment);
	} catch (error) {
		sendError(res, "Paymentni yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deletePayment(req, res) {
	if (!req.params.id) return sendError(res, "ID topilmadi", 400);
	try {
		const remove = await paymentService.deleteById(req.params.id, req.tenantId);
		sendSuccess(res, remove);
	} catch (error) {
		sendError(res, "To'lovni o'chirishda xatolik yuz berdi", 500, error);
	}
}
export async function TopDebtors(req, res) {
	try {
		const topDebtors = await paymentService.TopDebtors(req.tenantId);
		sendSuccess(res, topDebtors);
	} catch (error) {
		sendError(res, "Server xatosi", 500, error);
	}
}