const handleReportRouteError = (error) => {
    console.error("Report Route Error:", error);

    let statusCode = 500;

    if (error.message === "Invalid or Expired Token") {
        statusCode = 401;
    } else if (
        error.message?.includes("Access Denied")
    ) {
        statusCode = 403;
    }

    return Response.json(
        {
            success: false,
            message:
                statusCode === 500
                    ? "Internal Server Error"
                    : error.message,
        },
        { status: statusCode }
    );
};

export default handleReportRouteError;