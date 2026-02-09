export const sendSuccess = (
	res,
	data=null,
	message = "Success",
	statusCode = 200,
) => {
	return res.status(statusCode).json(data);
};

export const sendError = (res, message, statusCode = 500, error = null) => {
	
		console.error("Error:", error);


	return res.status(statusCode).json({
		success: false,
		message,
		error: process.env.NODE_ENV === "development" ? error : undefined,
	});
};
