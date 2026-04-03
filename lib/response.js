export const sendSuccess = (
	res,
	data = null,
	statusCode = 200,
) => {
	return res.status(statusCode).json(data);
};

export const sendError = (res, message, statusCode = 500, error = null) => {
	console.error(error == null ? message : error);

	return res.status(statusCode).json({
		success: false,
		message:
			statusCode === 500 && process.env.NODE_ENV === "production"
				? "Kutilmagan xatolik yuz berdi. Biz buni tuzatish ustida ishlayapmiz." // Production'da foydalanuvchiga texnik gap aytilmaydi
				: message,
		// Faqat development rejimida stack-trace va obyektni yuboramiz
		...(process.env.NODE_ENV === "development" && {
			stack: error?.stack,
			details: error,
		}),
	});
};
