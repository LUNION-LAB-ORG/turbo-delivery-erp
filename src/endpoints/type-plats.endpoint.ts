const typePlatsEndpoints = () => {
    const namespace = '/api/turbo/erp/collection';
    return {
        base: `${namespace}`,
        getAll: `${namespace}/get`,
        add: `${namespace}/add`,
        update: (id: string) => `${namespace}/update/${id}`,
        delete: (id: string) => `${namespace}/delete/${id}`,
        info: (id: string) => `${namespace}/detail/${id}`,
    };
};

export default typePlatsEndpoints();
