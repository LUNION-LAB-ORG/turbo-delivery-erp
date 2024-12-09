const deliveryMenEndpoints = () => {
    const namespace = '/api/erp/validation/livreur';
    return {
        base: `${namespace}`,
        getAll: `${namespace}/validate/opsmanager/0`,
        getAllValidated: `${namespace}/validate/authserv/0`,
        getAllNoValidated: `${namespace}/not/validated/0`,
        validateAuth: (id: string) => `${namespace}/enable/authserv/${id}`,
        validateOps: (id: string) => `${namespace}/enable/opsmanager/${id}`,
        info: (id: string) => `${namespace}/get/info/${id}`,
    };
};

export default deliveryMenEndpoints();
