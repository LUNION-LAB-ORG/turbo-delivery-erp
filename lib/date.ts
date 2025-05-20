export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
};
