// src/utils/dateUtils.js
export const formatDate = (date, format = 'short') => {
    if (!date) return '';
    
    try {
        // Si date ya es un string, evitar crear un nuevo objeto Date
        if (typeof date === 'string') {
            // Si ya es una fecha formateada, retornarla
            if (date.includes('/')) return date;
        }
        
        const dateObj = new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return '';
        }

        const options = {
            short: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            },
            long: {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            },
            withTime: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }
        };

        return dateObj.toLocaleDateString('es-CO', options[format]);
    } catch (error) {
        console.error('Error formateando fecha:', error);
        // Si hay un error, intentar retornar la fecha original si es string
        return typeof date === 'string' ? date : '';
    }
};