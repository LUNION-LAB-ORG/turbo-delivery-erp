const restaurantsEndpoints = () => {
    const namespace = '/api/erp/validation/restaurant';
    return {
        base: `${namespace}`,
        getAll: `${namespace}/validated/opsmanager/0`,
        getAllValidated: `${namespace}/validated/authservice/0`,
        getAllNoValidated: `${namespace}/not/validated/0`,
        validateAuth: (id: string) => `${namespace}/validate/by/authservice/${id}`,
        validateOps: (id: string) => `${namespace}/validate/by/opsmanager/${id}`,
        info: (id: string) => `${namespace}/info/${id}`,
    };
};

export default restaurantsEndpoints();
