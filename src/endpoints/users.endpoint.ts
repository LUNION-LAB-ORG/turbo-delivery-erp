const usersEndpoints = () => {
    const namespace = '/api/V1/turbo/erp/user';
    return {
        base: `${namespace}`,
        login: `${namespace}/login`,
        changePassword: `${namespace}/change/password`,
        profile: `${namespace}/profile`,
        getAll: `${namespace}/get/0`,
        getOne: `${namespace}/info`,
        update: `${namespace}/update`,
        disableEnable: (id: string) => `${namespace}/disable/enable/${id}`,
        deleteRestaure: (id: string) => `${namespace}/delete/restaured/${id}`,
        create: `${namespace}/create`,
    };
};

export default usersEndpoints();
