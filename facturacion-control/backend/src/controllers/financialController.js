// controllers/financialController.js
const logger = require('../utils/logger');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Contract = require('../models/Contract');
const fileExportService = require('../services/fileExportService');

/**
 * Controlador para el módulo de Análisis Financiero
 */
const financialController = {
  /**
   * Obtiene los KPIs financieros
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getFinancialKPIs: async (req, res) => {
    try {
      const { startDate, endDate, entityId, contractId } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (contractId) {
        filter.contractId = contractId;
      }
      
      // Obtener datos de facturas para el período
      const invoices = await Invoice.find(filter);
      
      // Obtener datos de pagos para el período
      const paymentFilter = { ...filter };
      if (filter.date) {
        paymentFilter.paymentDate = filter.date;
        delete paymentFilter.date;
      }
      const payments = await Payment.find(paymentFilter);
      
      // Calcular KPIs
      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalValue, 0);
      const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
      const collectionRatio = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
      
      // Calcular glosas
      const totalGlosas = invoices.reduce((sum, inv) => sum + (inv.glosaValue || 0), 0);
      const glosaRate = totalInvoiced > 0 ? (totalGlosas / totalInvoiced) * 100 : 0;
      
      // Calcular rechazos
      const rejectedInvoices = invoices.filter(inv => inv.status === 'rejected');
      const rejectionRate = invoices.length > 0 ? (rejectedInvoices.length / invoices.length) * 100 : 0;
      
      // Obtener períodos anteriores para calcular tendencias
      const previousFilter = { ...filter };
      if (filter.date) {
        // Calcular período anterior del mismo tamaño
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const diffTime = endDateObj - startDateObj;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const prevEndDate = new Date(startDateObj);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - diffDays);
        
        previousFilter.date = { $gte: prevStartDate, $lte: prevEndDate };
      }
      
      const previousInvoices = await Invoice.find(previousFilter);
      const previousTotal = previousInvoices.reduce((sum, inv) => sum + inv.totalValue, 0);
      
      // Calcular tendencias
      const invoiceGrowth = previousTotal > 0 ? ((totalInvoiced - previousTotal) / previousTotal) * 100 : 0;
      
      // Retornar KPIs
      res.json({
        success: true,
        data: {
          total_invoiced: totalInvoiced,
          total_collected: totalCollected,
          collection_ratio: collectionRatio,
          invoice_glosa_rate: glosaRate,
          invoice_rejection_rate: rejectionRate,
          revenue_growth: invoiceGrowth,
          // Tendencias
          total_invoiced_trend: invoiceGrowth,
          collection_ratio_trend: 0, // Calcular basado en período anterior
          invoice_glosa_rate_trend: 0, // Calcular basado en período anterior
          total_invoices: invoices.length,
          total_glosas: totalGlosas
        }
      });
    } catch (error) {
      logger.error({
        type: 'financial_kpi_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener KPIs financieros',
        error: error.message
      });
    }
  },

  /**
   * Obtiene tendencias de facturación
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getBillingTrends: async (req, res) => {
    try {
      const { startDate, endDate, entityId, contractId, period = 'monthly' } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (contractId) {
        filter.contractId = contractId;
      }
      
      // Obtener datos de facturas
      const invoices = await Invoice.find(filter).sort({ date: 1 });
      
      // Agrupar por período
      const trendData = [];
      
      // Helper para formatear períodos
      const formatPeriod = (date, periodType) => {
        const d = new Date(date);
        switch (periodType) {
          case 'monthly':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          case 'quarterly':
            const quarter = Math.floor(d.getMonth() / 3) + 1;
            return `${d.getFullYear()}-Q${quarter}`;
          case 'yearly':
            return `${d.getFullYear()}`;
          default:
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      };
      
      // Agrupar facturas por período
      const groupedByPeriod = {};
      
      for (const invoice of invoices) {
        const periodKey = formatPeriod(invoice.date, period);
        
        if (!groupedByPeriod[periodKey]) {
          groupedByPeriod[periodKey] = {
            invoiced: 0,
            count: 0
          };
        }
        
        groupedByPeriod[periodKey].invoiced += invoice.totalValue;
        groupedByPeriod[periodKey].count += 1;
      }
      
      // Convertir a array para respuesta
      for (const [period, data] of Object.entries(groupedByPeriod)) {
        trendData.push({
          period,
          invoiced: data.invoiced,
          count: data.count,
          // Agregar meta basada en contrato si está disponible
          target: 0, // Implementar cálculo basado en contrato
          growth: 0 // Calcular en relación al período anterior
        });
      }
      
      // Calcular crecimiento
      for (let i = 1; i < trendData.length; i++) {
        const prevPeriod = trendData[i - 1];
        const currPeriod = trendData[i];
        
        if (prevPeriod.invoiced > 0) {
          currPeriod.growth = ((currPeriod.invoiced - prevPeriod.invoiced) / prevPeriod.invoiced) * 100;
        }
      }
      
      // Ordenar por período
      trendData.sort((a, b) => a.period.localeCompare(b.period));
      
      res.json({
        success: true,
        data: trendData
      });
    } catch (error) {
      logger.error({
        type: 'billing_trends_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener tendencias de facturación',
        error: error.message
      });
    }
  },

  /**
   * Obtiene tendencias de recaudos
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getCollectionTrends: async (req, res) => {
    try {
      const { startDate, endDate, entityId, contractId, period = 'monthly' } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (contractId) {
        filter.contractId = contractId;
      }
      
      // Obtener datos de pagos
      const payments = await Payment.find(filter).sort({ paymentDate: 1 });
      
      // Helper para formatear períodos
      const formatPeriod = (date, periodType) => {
        const d = new Date(date);
        switch (periodType) {
          case 'monthly':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          case 'quarterly':
            const quarter = Math.floor(d.getMonth() / 3) + 1;
            return `${d.getFullYear()}-Q${quarter}`;
          case 'yearly':
            return `${d.getFullYear()}`;
          default:
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      };
      
      // Agrupar pagos por período
      const groupedByPeriod = {};
      
      for (const payment of payments) {
        const periodKey = formatPeriod(payment.paymentDate, period);
        
        if (!groupedByPeriod[periodKey]) {
          groupedByPeriod[periodKey] = {
            collected: 0,
            count: 0
          };
        }
        
        groupedByPeriod[periodKey].collected += payment.amount;
        groupedByPeriod[periodKey].count += 1;
      }
      
      // Convertir a array para respuesta
      const trendData = [];
      for (const [period, data] of Object.entries(groupedByPeriod)) {
        trendData.push({
          period,
          collected: data.collected,
          count: data.count,
          growth: 0 // Calcular en relación al período anterior
        });
      }
      
      // Calcular crecimiento
      for (let i = 1; i < trendData.length; i++) {
        const prevPeriod = trendData[i - 1];
        const currPeriod = trendData[i];
        
        if (prevPeriod.collected > 0) {
          currPeriod.growth = ((currPeriod.collected - prevPeriod.collected) / prevPeriod.collected) * 100;
        }
      }
      
      // Ordenar por período
      trendData.sort((a, b) => a.period.localeCompare(b.period));
      
      res.json({
        success: true,
        data: trendData
      });
    } catch (error) {
      logger.error({
        type: 'collection_trends_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener tendencias de recaudos',
        error: error.message
      });
    }
  },

  /**
   * Obtiene proyecciones financieras
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getFinancialProjections: async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        entityId, 
        contractId, 
        dataType = 'revenue',
        method = 'linear_regression',
        periods = 12
      } = req.query;
      
      // Obtener datos históricos
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (contractId) {
        filter.contractId = contractId;
      }
      
      // Obtener datos según tipo
      let historicalData = [];
      
      if (dataType === 'revenue') {
        const invoices = await Invoice.find(filter).sort({ date: 1 });
        
        // Agrupar por mes
        const monthlyData = {};
        for (const invoice of invoices) {
          const month = `${invoice.date.getFullYear()}-${String(invoice.date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[month]) {
            monthlyData[month] = {
              date: month,
              value: 0
            };
          }
          
          monthlyData[month].value += invoice.totalValue;
        }
        
        historicalData = Object.values(monthlyData);
      } else if (dataType === 'collection') {
        const paymentFilter = { ...filter };
        if (filter.date) {
          paymentFilter.paymentDate = filter.date;
          delete paymentFilter.date;
        }
        
        const payments = await Payment.find(paymentFilter).sort({ paymentDate: 1 });
        
        // Agrupar por mes
        const monthlyData = {};
        for (const payment of payments) {
          const month = `${payment.paymentDate.getFullYear()}-${String(payment.paymentDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[month]) {
            monthlyData[month] = {
              date: month,
              value: 0
            };
          }
          
          monthlyData[month].value += payment.amount;
        }
        
        historicalData = Object.values(monthlyData);
      }
      
      // Ordenar datos cronológicamente
      historicalData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Generar proyección
      const projectedData = [];
      
      // Último mes de datos históricos
      if (historicalData.length > 0) {
        const lastData = historicalData[historicalData.length - 1];
        const [lastYear, lastMonth] = lastData.date.split('-').map(Number);
        
        // Métodos de proyección
        if (method === 'linear_regression' && historicalData.length >= 6) {
          // Implementación básica de regresión lineal
          const xValues = historicalData.map((_, i) => i);
          const yValues = historicalData.map(item => item.value);
          
          // Calcular coeficientes de regresión
          const n = xValues.length;
          const sumX = xValues.reduce((sum, x) => sum + x, 0);
          const sumY = yValues.reduce((sum, y) => sum + y, 0);
          const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
          const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
          
          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;
          
          // Generar proyecciones
          for (let i = 1; i <= periods; i++) {
            let nextYear = lastYear;
            let nextMonth = lastMonth + i;
            
            // Ajustar año si el mes excede 12
            while (nextMonth > 12) {
              nextYear++;
              nextMonth -= 12;
            }
            
            const projectedValue = intercept + slope * (n + i - 1);
            const variance = Math.abs(projectedValue * 0.1); // Varianza del 10%
            
            projectedData.push({
              date: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
              value: Math.max(0, projectedValue), // Valor no puede ser negativo
              upperBound: projectedValue + variance,
              lowerBound: Math.max(0, projectedValue - variance),
              projected: true
            });
          }
        } else if (method === 'moving_average' && historicalData.length >= 3) {
          // Implementación de media móvil (últimos 3 períodos)
          const windowSize = 3;
          const lastValues = historicalData.slice(-windowSize).map(item => item.value);
          
          for (let i = 1; i <= periods; i++) {
            let nextYear = lastYear;
            let nextMonth = lastMonth + i;
            
            // Ajustar año si el mes excede 12
            while (nextMonth > 12) {
              nextYear++;
              nextMonth -= 12;
            }
            
            // Calcular media móvil
            const average = lastValues.reduce((sum, val) => sum + val, 0) / windowSize;
            
            projectedData.push({
              date: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
              value: average,
              projected: true
            });
            
            // Actualizar valores para siguiente proyección
            lastValues.shift();
            lastValues.push(average);
          }
        } else if (method === 'seasonal' && historicalData.length >= 12) {
          // Implementación básica de proyección estacional
          // Requiere al menos un año completo de datos históricos
          
          // Para una implementación completa se requiere análisis de factores estacionales
          // Esta es una implementación simplificada
          
          // Asumimos que el patrón estacional se repite cada 12 meses
          const seasonalFactors = Array(12).fill(0).map((_, i) => {
            const monthData = historicalData.filter(item => {
              const [, month] = item.date.split('-').map(Number);
              return month === i + 1;
            });
            
            if (monthData.length === 0) return 1; // Si no hay datos, factor neutral
            
            return monthData.reduce((sum, item) => sum + item.value, 0) / monthData.length;
          });
          
          // Normalizar factores estacionales
          const avgFactor = seasonalFactors.reduce((sum, factor) => sum + factor, 0) / 12;
          const normalizedFactors = seasonalFactors.map(factor => factor / avgFactor);
          
          // Generar proyecciones
          for (let i = 1; i <= periods; i++) {
            let nextYear = lastYear;
            let nextMonth = lastMonth + i;
            
            // Ajustar año si el mes excede 12
            while (nextMonth > 12) {
              nextYear++;
              nextMonth -= 12;
            }
            
            // Usar tendencia lineal como base
            const baseProjection = intercept + slope * (n + i - 1);
            
            // Aplicar factor estacional
            const seasonalFactor = normalizedFactors[nextMonth - 1];
            const projectedValue = baseProjection * seasonalFactor;
            
            projectedData.push({
              date: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
              value: Math.max(0, projectedValue),
              baseValue: baseProjection,
              seasonalFactor,
              projected: true
            });
          }
        } else {
          // Proyección simple (último valor repetido con tendencia porcentual)
          // Calcular tendencia basada en los últimos meses
          let trend = 0;
          
          if (historicalData.length >= 2) {
            const lastValue = historicalData[historicalData.length - 1].value;
            const prevValue = historicalData[historicalData.length - 2].value;
            
            if (prevValue > 0) {
              trend = (lastValue - prevValue) / prevValue;
            }
          }
          
          let lastValue = historicalData[historicalData.length - 1].value;
          
          for (let i = 1; i <= periods; i++) {
            let nextYear = lastYear;
            let nextMonth = lastMonth + i;
            
            // Ajustar año si el mes excede 12
            while (nextMonth > 12) {
              nextYear++;
              nextMonth -= 12;
            }
            
            // Aplicar tendencia
            lastValue = lastValue * (1 + trend);
            
            projectedData.push({
              date: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
              value: Math.max(0, lastValue),
              projected: true
            });
          }
        }
      }
      
      // Unir datos históricos y proyección
      const combinedData = [...historicalData, ...projectedData];
      
      res.json({
        success: true,
        data: combinedData,
        method,
        dataType
      });
    } catch (error) {
      logger.error({
        type: 'financial_projections_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al generar proyecciones financieras',
        error: error.message
      });
    }
  },

  /**
   * Obtiene análisis de cartera por edades
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getAccountsReceivableAging: async (req, res) => {
    try {
      const { cutoffDate = new Date(), entityId } = req.query;
      
      // Fecha de corte para el análisis
      const cutoff = new Date(cutoffDate);
      
      // Construir filtro
      const filter = {
        status: { $nin: ['paid', 'cancelled'] },
        date: { $lte: cutoff }
      };
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      // Obtener facturas pendientes
      const pendingInvoices = await Invoice.find(filter);
      
      // Definir rangos de edades (en días)
      const ageRanges = [
        { name: '0-30 días', min: 0, max: 30 },
        { name: '31-60 días', min: 31, max: 60 },
        { name: '61-90 días', min: 61, max: 90 },
        { name: '91-180 días', min: 91, max: 180 },
        { name: '181-360 días', min: 181, max: 360 },
        { name: '> 360 días', min: 361, max: Number.MAX_SAFE_INTEGER }
      ];
      
      // Inicializar resultados
      const agingResults = ageRanges.map(range => ({
        rangeName: range.name,
        minDays: range.min,
        maxDays: range.max,
        count: 0,
        amount: 0,
        invoices: []
      }));
      
      // Clasificar facturas por edad
      for (const invoice of pendingInvoices) {
        const invoiceDate = new Date(invoice.date);
        const ageInDays = Math.floor((cutoff - invoiceDate) / (1000 * 60 * 60 * 24));
        
        // Buscar rango correspondiente
        const range = ageRanges.find(r => ageInDays >= r.min && ageInDays <= r.max);
        if (range) {
          const rangeIndex = ageRanges.indexOf(range);
          agingResults[rangeIndex].count += 1;
          agingResults[rangeIndex].amount += invoice.totalValue;
          agingResults[rangeIndex].invoices.push({
            id: invoice._id,
            number: invoice.number,
            date: invoice.date,
            entityName: invoice.entityName,
            value: invoice.totalValue,
            age: ageInDays
          });
        }
      }
      
      // Calcular estadísticas generales
      const totalAmount = agingResults.reduce((sum, range) => sum + range.amount, 0);
      const totalCount = agingResults.reduce((sum, range) => sum + range.count, 0);
      
      // Calcular porcentajes
      agingResults.forEach(range => {
        range.percentage = totalAmount > 0 ? (range.amount / totalAmount) * 100 : 0;
      });
      
      res.json({
        success: true,
        cutoffDate,
        data: agingResults,
        summary: {
          totalAmount,
          totalCount,
          averageAge: totalCount > 0 ? 
            pendingInvoices.reduce((sum, inv) => {
              const age = Math.floor((cutoff - new Date(inv.date)) / (1000 * 60 * 60 * 24));
              return sum + age;
            }, 0) / totalCount : 0
        }
      });
    } catch (error) {
      logger.error({
        type: 'accounts_receivable_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener análisis de cartera por edades',
        error: error.message
      });
    }
  },

  /**
   * Obtiene análisis de rentabilidad
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getProfitabilityAnalysis: async (req, res) => {
    try {
      const { startDate, endDate, entityId, contractId, groupBy = 'service' } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (contractId) {
        filter.contractId = contractId;
      }
      
      // Obtener facturas y servicios
      const invoices = await Invoice.find(filter)
        .populate('services')
        .populate('costs');
      
      // Preparar datos según agrupación
      let profitabilityData = [];
      
      if (groupBy === 'service') {
        // Agrupar por tipo de servicio
        const serviceGroups = {};
        
        for (const invoice of invoices) {
          if (invoice.services && invoice.services.length > 0) {
            for (const service of invoice.services) {
              const serviceType = service.serviceType || 'Sin categoría';
              
              if (!serviceGroups[serviceType]) {
                serviceGroups[serviceType] = {
                  serviceType,
                  revenue: 0,
                  cost: 0,
                  count: 0
                };
              }
              
              serviceGroups[serviceType].revenue += service.value || 0;
              serviceGroups[serviceType].count += 1;
              
              // Asociar costos si están disponibles
              if (invoice.costs) {
                const serviceCosts = invoice.costs.filter(cost => 
                  cost.serviceId && cost.serviceId.toString() === service._id.toString()
                );
                
                const totalCost = serviceCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
                serviceGroups[serviceType].cost += totalCost;
              }
            }
          }
        }
        
        // Convertir a array y calcular rentabilidad
        profitabilityData = Object.values(serviceGroups);
        
      } else if (groupBy === 'contract') {
        // Agrupar por contrato
        const contractGroups = {};
        
        for (const invoice of invoices) {
          const contractId = invoice.contractId ? invoice.contractId.toString() : 'Sin contrato';
          const contractName = invoice.contractName || 'Sin contrato';
          
          if (!contractGroups[contractId]) {
            contractGroups[contractId] = {
              contractId,
              contractName,
              revenue: 0,
              cost: 0,
              count: 0
            };
          }
          
          contractGroups[contractId].revenue += invoice.totalValue || 0;
          contractGroups[contractId].count += 1;
          
          // Sumar costos
          if (invoice.costs) {
            const totalCost = invoice.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
            contractGroups[contractId].cost += totalCost;
          }
        }
        
        // Convertir a array
        profitabilityData = Object.values(contractGroups);
        
      } else if (groupBy === 'entity') {
        // Agrupar por entidad
        const entityGroups = {};
        
        for (const invoice of invoices) {
          const entityId = invoice.entityId ? invoice.entityId.toString() : 'Sin entidad';
          const entityName = invoice.entityName || 'Sin entidad';
          
          if (!entityGroups[entityId]) {
            entityGroups[entityId] = {
              entityId,
              entityName,
              revenue: 0,
              cost: 0,
              count: 0
            };
          }
          
          entityGroups[entityId].revenue += invoice.totalValue || 0;
          entityGroups[entityId].count += 1;
          
          // Sumar costos
          if (invoice.costs) {
            const totalCost = invoice.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
            entityGroups[entityId].cost += totalCost;
          }
        }
        
        // Convertir a array
        profitabilityData = Object.values(entityGroups);
      }
      
      // Calcular rentabilidad para todos los grupos
      profitabilityData.forEach(group => {
        group.profit = group.revenue - group.cost;
        group.margin = group.revenue > 0 ? (group.profit / group.revenue) * 100 : 0;
      });
      
      // Ordenar por margen de rentabilidad (de mayor a menor)
      profitabilityData.sort((a, b) => b.margin - a.margin);
      
      res.json({
        success: true,
        data: profitabilityData,
        groupBy,
        summary: {
          totalRevenue: profitabilityData.reduce((sum, group) => sum + group.revenue, 0),
          totalCost: profitabilityData.reduce((sum, group) => sum + group.cost, 0),
          totalProfit: profitabilityData.reduce((sum, group) => sum + group.profit, 0),
          averageMargin: profitabilityData.length > 0 ?
            profitabilityData.reduce((sum, group) => sum + group.margin, 0) / profitabilityData.length : 0
        }
      });
    } catch (error) {
      logger.error({
        type: 'profitability_analysis_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener análisis de rentabilidad',
        error: error.message
      });
    }
  },

  /**
   * Exporta reporte financiero
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  exportFinancialReport: async (req, res) => {
    try {
      const { reportType } = req.params;
      const { format = 'PDF', ...params } = req.body;
      
      // Obtener datos según el tipo de reporte
      let reportData = { headers: [], rows: [] };
      
      switch (reportType) {
        case 'billing_trends':
          // Obtener datos de facturación
          const billingResponse = await financialController.getBillingTrends({
            query: params
          }, { json: () => {} });
          
          // Formatear para exportación
          reportData.headers = ['Período', 'Facturado', 'Cantidad', 'Meta', 'Crecimiento (%)'];
          reportData.rows = billingResponse.data.map(item => [
            item.period,
            item.invoiced,
            item.count,
            item.target,
            item.growth.toFixed(2)
          ]);
          break;
          
        case 'collection_trends':
          // Obtener datos de recaudos
          const collectionResponse = await financialController.getCollectionTrends({
            query: params
          }, { json: () => {} });
          
          // Formatear para exportación
          reportData.headers = ['Período', 'Recaudado', 'Cantidad', 'Crecimiento (%)'];
          reportData.rows = collectionResponse.data.map(item => [
            item.period,
            item.collected,
            item.count,
            item.growth.toFixed(2)
          ]);
          break;
          
        case 'accounts_receivable':
          // Obtener análisis de cartera
          const arResponse = await financialController.getAccountsReceivableAging({
            query: params
          }, { json: () => {} });
          
          // Formatear para exportación
          reportData.headers = ['Rango', 'Cantidad', 'Monto', 'Porcentaje (%)'];
          reportData.rows = arResponse.data.map(item => [
            item.rangeName,
            item.count,
            item.amount,
            item.percentage.toFixed(2)
          ]);
          break;
          
        case 'profitability':
          // Obtener análisis de rentabilidad
          const profitResponse = await financialController.getProfitabilityAnalysis({
            query: params
          }, { json: () => {} });
          
          // Formatear para exportación según agrupación
          if (params.groupBy === 'service') {
            reportData.headers = ['Tipo de Servicio', 'Ingresos', 'Costos', 'Utilidad', 'Margen (%)', 'Cantidad'];
            reportData.rows = profitResponse.data.map(item => [
              item.serviceType,
              item.revenue,
              item.cost,
              item.profit,
              item.margin.toFixed(2),
              item.count
            ]);
          } else if (params.groupBy === 'contract') {
            reportData.headers = ['Contrato', 'Ingresos', 'Costos', 'Utilidad', 'Margen (%)', 'Cantidad'];
            reportData.rows = profitResponse.data.map(item => [
              item.contractName,
              item.revenue,
              item.cost,
              item.profit,
              item.margin.toFixed(2),
              item.count
            ]);
          } else if (params.groupBy === 'entity') {
            reportData.headers = ['Entidad', 'Ingresos', 'Costos', 'Utilidad', 'Margen (%)', 'Cantidad'];
            reportData.rows = profitResponse.data.map(item => [
              item.entityName,
              item.revenue,
              item.cost,
              item.profit,
              item.margin.toFixed(2),
              item.count
            ]);
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: `Tipo de reporte no válido: ${reportType}`
          });
      }
      
      // Generar archivo de exportación
      const outputFile = await fileExportService.exportFinancialReport(
        reportData,
        format,
        reportType
      );
      
      // Enviar URL de descarga
      res.json({
        success: true,
        message: `Reporte financiero generado en formato ${format}`,
        downloadUrl: `/api/financial/download/${path.basename(outputFile)}`
      });
    } catch (error) {
      logger.error({
        type: 'export_financial_report_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al exportar reporte financiero',
        error: error.message
      });
    }
  },

  /**
   * Obtiene el valor de un KPI específico
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getKPIValue: async (req, res) => {
    try {
      const { kpiId } = req.params;
      const params = req.query;
      
      // Obtener todos los KPIs
      const kpisResponse = await financialController.getFinancialKPIs({
        query: params
      }, { json: () => {} });
      
      // Buscar KPI específico
      if (kpisResponse.data && kpisResponse.data[kpiId] !== undefined) {
        res.json({
          success: true,
          data: {
            id: kpiId,
            value: kpisResponse.data[kpiId],
            trend: kpisResponse.data[`${kpiId}_trend`] || 0
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: `KPI no encontrado: ${kpiId}`
        });
      }
    } catch (error) {
      logger.error({
        type: 'get_kpi_value_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener valor de KPI',
        error: error.message
      });
    }
  },

  /**
   * Obtiene historial de un KPI a lo largo del tiempo
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getKPIHistory: async (req, res) => {
    try {
      const { kpiId } = req.params;
      const { startDate, endDate, entityId, contractId, period = 'monthly' } = req.query;
      
      // Determinar tipo de KPI
      let historyData = [];
      
      // KPIs relacionados con facturación
      if (['total_invoiced', 'invoice_rejection_rate', 'invoice_glosa_rate'].includes(kpiId)) {
        const billingResponse = await financialController.getBillingTrends({
          query: { startDate, endDate, entityId, contractId, period }
        }, { json: () => {} });
        
        if (kpiId === 'total_invoiced') {
          historyData = billingResponse.data.map(item => ({
            period: item.period,
            value: item.invoiced,
            trend: item.growth
          }));
        } else {
          // Obtener datos adicionales para otros KPIs de facturación
          // Implementación específica según KPI
        }
      }
      // KPIs relacionados con recaudos
      else if (['total_collected', 'collection_ratio'].includes(kpiId)) {
        const collectionResponse = await financialController.getCollectionTrends({
          query: { startDate, endDate, entityId, contractId, period }
        }, { json: () => {} });
        
        if (kpiId === 'total_collected') {
          historyData = collectionResponse.data.map(item => ({
            period: item.period,
            value: item.collected,
            trend: item.growth
          }));
        } else {
          // Implementación para collection_ratio
        }
      }
      // KPIs de rentabilidad
      else if (['profit_margin', 'revenue_growth'].includes(kpiId)) {
        // Implementación para KPIs de rentabilidad
      }
      
      res.json({
        success: true,
        data: historyData,
        kpiId,
        period
      });
    } catch (error) {
      logger.error({
        type: 'get_kpi_history_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de KPI',
        error: error.message
      });
    }
  },

  /**
   * Obtiene KPIs por categoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getKPIsByCategory: async (req, res) => {
    try {
      const { kpiIds, params } = req.body;
      
      // Obtener todos los KPIs
      const kpisResponse = await financialController.getFinancialKPIs({
        query: params
      }, { json: () => {} });
      
      // Filtrar por IDs solicitados
      const result = {};
      
      if (kpiIds && Array.isArray(kpiIds)) {
        for (const kpiId of kpiIds) {
          if (kpisResponse.data && kpisResponse.data[kpiId] !== undefined) {
            result[kpiId] = {
              value: kpisResponse.data[kpiId],
              trend: kpisResponse.data[`${kpiId}_trend`] || 0
            };
          }
        }
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error({
        type: 'get_kpis_by_category_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener KPIs por categoría',
        error: error.message
      });
    }
  },

  /**
   * Obtiene estadísticas financieras generales
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getFinancialStats: async (req, res) => {
    try {
      const { startDate, endDate, entityId, contractId } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (contractId) {
        filter.contractId = contractId;
      }
      
      // Obtener datos
      const invoices = await Invoice.find(filter);
      const paymentFilter = { ...filter };
      if (filter.date) {
        paymentFilter.paymentDate = filter.date;
        delete paymentFilter.date;
      }
      const payments = await Payment.find(paymentFilter);
      
      // Calcular estadísticas
      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalValue, 0);
      const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
      
      // Distribuir por entidades
      const entityStats = {};
      for (const invoice of invoices) {
        const entityId = invoice.entityId ? invoice.entityId.toString() : 'unknown';
        const entityName = invoice.entityName || 'Desconocida';
        
        if (!entityStats[entityId]) {
          entityStats[entityId] = {
            entityId,
            entityName,
            invoiced: 0,
            collected: 0,
            count: 0
          };
        }
        
        entityStats[entityId].invoiced += invoice.totalValue;
        entityStats[entityId].count += 1;
      }
      
      // Agregar recaudos por entidad
      for (const payment of payments) {
        const entityId = payment.entityId ? payment.entityId.toString() : 'unknown';
        
        if (entityStats[entityId]) {
          entityStats[entityId].collected += payment.amount;
        }
      }
      
      // Convertir a array y calcular porcentajes
      const entitiesData = Object.values(entityStats);
      entitiesData.forEach(entity => {
        entity.collectionRatio = entity.invoiced > 0 ? (entity.collected / entity.invoiced) * 100 : 0;
        entity.invoicedPercentage = totalInvoiced > 0 ? (entity.invoiced / totalInvoiced) * 100 : 0;
      });
      
      // Ordenar por monto facturado (de mayor a menor)
      entitiesData.sort((a, b) => b.invoiced - a.invoiced);
      
      res.json({
        success: true,
        data: {
          totalInvoiced,
          totalCollected,
          collectionRatio: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
          invoiceCount: invoices.length,
          paymentCount: payments.length,
          entities: entitiesData
        }
      });
    } catch (error) {
      logger.error({
        type: 'get_financial_stats_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas financieras',
        error: error.message
      });
    }
  }
};

module.exports = financialController;