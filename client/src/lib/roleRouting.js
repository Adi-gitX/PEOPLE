export const getDefaultPathForRole = (role) => {
    if (role === 'admin') return '/admin';
    if (role === 'initiator') return '/dashboard/initiator';
    return '/dashboard/contributor';
};

export default getDefaultPathForRole;
