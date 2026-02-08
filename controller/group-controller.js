import groupRepo from "../repositories/groupRepo.js";
import { sendSuccess, sendError } from "../lib/response.js";

	export async function getAllGroups(req, res) {
		try {
			const groups = await groupRepo.getAll();
			sendSuccess(res, groups, "Guruhlar muvaffaqiyatli olindi", 200);
		} catch (error) {
			sendError(res, "Guruhlarni olishda xatolik yuz berdi", 500, error);
		}
	}
	export async function createGroup(req, res) {
		const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
			req.body;
		if (
			!name ||
			!course_type ||
			!price ||
			!lesson_time ||
			!lesson_days ||
			!teacher_id
		) {
			return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
		}
		try {
			const newGroup = await groupRepo.create({
				name,
				course_type,
				price,
				lesson_time,
				lesson_days,
				teacher_id,
			});
			sendSuccess(res, newGroup, "Guruh muvaffaqiyatli yaratildi", 201);
		} catch (error) {
			sendError(res, "Guruh yaratishda xatolik yuz berdi", 500, error);
		}
	}
	export async function getSingleGroup(req, res) {
		if (!req.params.id)
			return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
      try {
         const group = await groupRepo.getById(req.params.id);
         if (!group) {
            return sendError(res, "Guruh topilmadi", 404);
         }
			sendSuccess(res, group, "Guruh muvaffaqiyatli olindi", 200);
		} catch (error) {
			sendError(res, "Guruhni olishda xatolik yuz berdi", 500, error);
		}
	}
	export async function getStudentsInGroup(req, res) {
		if (!req.params.id)
			return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
		try {
			const students = await groupRepo.getStudentInGroup(req.params.id);
         sendSuccess(res, students, "O'quvchilar muvaffaqiyatli olindi", 200);
		} catch (error) {
			sendError(res, "O'quvchilarni olishda xatolik yuz berdi", 500, error);
		}
	}
	export async function updateGroup(req, res) {
		const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
			req.body;
		if (
			!name ||
			!course_type ||
			!price ||
			!lesson_time ||
			!lesson_days ||
			!teacher_id
		) {
			return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
		}
		try {
			const updatedGroup = await groupRepo.update(req.params.id, {
				name,
				course_type,
				price,
				lesson_time,
				lesson_days,
				teacher_id,
			});
			sendSuccess(res, updatedGroup, "Guruh muvaffaqiyatli yangilandi", 200);
		} catch (error) {
			sendError(res, "Guruhni yangilashda xatolik yuz berdi", 500, error);
		}
	}
	export async function deleteGroup(req, res) {
		if (!req.params.id) {
			return sendError(res, "Guruh ID si ko'rsatilmagan", 400  );
		}
		try {
			const result = await groupRepo.deleteById(req.params.id);
         sendSuccess(
            res,
            result,
            "Guruh muvaffaqiyatli o'chirildi va tegishli yozuvlar yangilandi",
            200,
         );
		} catch (error) {
			sendError(res, "Guruhni o'chirishda xatolik yuz berdi", 500, error);
		}
	}
