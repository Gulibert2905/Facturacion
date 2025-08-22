// src/utils/dateFormatter.js

export const formatServiceDate = (date) => {
    if (!date) return '';
    
    try {
    if (typeof date === 'string') {
    // Si ya es un string, verificar si necesita ser formateado
    if (date.includes('T')) {
        // Es un ISO string
        return date.split('T')[0];
    }
    return date;
    }
    
    if (date instanceof Date) {
    return date.toISOString().split('T')[0];
    }
    
    // Si no es ni string ni Date, intentar convertir
    return new Date(date).toISOString().split('T')[0];
} catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
}
};