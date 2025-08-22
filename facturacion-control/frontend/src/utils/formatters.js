// src/utils/formatters.js
/**
 * Utilidades para formatear diferentes tipos de datos en la aplicación
 */

/**
 * Formatea un valor numérico como moneda (COP)
 * @param {number} value - Valor a formatear
 * @param {boolean} showSymbol - Si debe mostrar el símbolo de moneda
 * @returns {string} Valor formateado como moneda
 */
export const formatCurrency = (value, showSymbol = true) => {
    if (value === null || value === undefined) return showSymbol ? '$0' : '0';
    
    const formatter = new Intl.NumberFormat('es-CO', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(value);
  };
  
  /**
   * Formatea un valor numérico con separador de miles
   * @param {number} value - Valor a formatear
   * @param {number} decimals - Número de decimales a mostrar
   * @returns {string} Valor formateado con separador de miles
   */
  export const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined) return '0';
    
    const formatter = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    return formatter.format(value);
  };
  
  /**
   * Formatea una fecha en formato legible
   * @param {string|Date} date - Fecha a formatear
   * @param {boolean} includeTime - Si debe incluir la hora
   * @returns {string} Fecha formateada
   */
  export const formatDate = (date, includeTime = false) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Fecha inválida';
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    
    return dateObj.toLocaleDateString('es-CO', options);
  };
  
  /**
   * Formatea un porcentaje
   * @param {number} value - Valor a formatear (0-100)
   * @param {number} decimals - Número de decimales a mostrar
   * @returns {string} Valor formateado como porcentaje
   */
  export const formatPercent = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    // Convertir a decimal si es necesario (si es mayor que 1)
    const normalizedValue = value > 1 ? value / 100 : value;
    
    return formatter.format(normalizedValue);
  };
  
  /**
   * Trunca un texto si excede una longitud máxima
   * @param {string} text - Texto a truncar
   * @param {number} maxLength - Longitud máxima
   * @returns {string} Texto truncado con elipsis si excedió la longitud
   */
  export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * Obtiene las iniciales de un nombre
   * @param {string} name - Nombre completo
   * @returns {string} Iniciales (máximo 2)
   */
  export const getInitials = (name) => {
    if (!name) return '';
    
    const parts = name.split(' ').filter(part => part.length > 0);
    
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };
  
  /**
   * Formatea un texto como título (primera letra de cada palabra en mayúscula)
   * @param {string} text - Texto a formatear
   * @returns {string} Texto formateado como título
   */
  export const toTitleCase = (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const formatters = {
    formatCurrency,
    formatNumber,
    formatDate,
    formatPercent,
    truncateText,
    getInitials,
    toTitleCase
  };
  
  export default formatters;