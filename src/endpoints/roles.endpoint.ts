const rolesEndpoints = () => {
    const namespace = '/api/V1/turbo/erp/user/roles';
    return {
        base: `${namespace}`,
        getAll: `${namespace}`,
    };
};

export default rolesEndpoints();
