
const roleMiddleware = (...allowedRoles) => {
    return (user) => {
        if (
            !user ||
            !allowedRoles.includes(Number(user.roleId))
        ) {
            throw new Error(
                "Forbidden: You do not have permission"
            );
        }

        return user;
    };
};

export default roleMiddleware;
