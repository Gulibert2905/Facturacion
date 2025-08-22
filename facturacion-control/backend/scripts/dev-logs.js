// scripts/dev-logs.js
const { MongoClient } = require('mongodb');
const colors = require('colors/safe');
require('dotenv').config();

// Configuración
const MONGO_URI = process.env.MONGO_URI;
const COLLECTION = 'logs';
const TAIL_SIZE = 20; // Número de logs recientes para mostrar al inicio

// Función para formatear los logs
function formatLog(log) {
  const timestamp = colors.gray(new Date(log.timestamp).toLocaleString());
  const level = getColoredLevel(log.level);
  
  let message = '';
  
  if (log.type === 'request') {
    message = `${colors.yellow(log.method)} ${colors.cyan(log.url)}`;
    if (log.userId) {
      message += ` [User: ${log.userId}]`;
    }
  } else if (log.type === 'error') {
    message = colors.red(log.error);
    if (log.stack) {
      message += `\n${colors.gray(log.stack)}`;
    }
  } else if (log.type === 'performance') {
    message = `${colors.magenta(log.operation)} - ${log.durationMs}ms`;
  } else {
    message = JSON.stringify(log);
  }
  
  return `${timestamp} ${level}: ${message}`;
}

function getColoredLevel(level) {
  switch (level) {
    case 'error': return colors.red(level);
    case 'warn': return colors.yellow(level);
    case 'info': return colors.green(level);
    case 'debug': return colors.blue(level);
    default: return level;
  }
}

async function watchLogs() {
  try {
    // Conectar a MongoDB
    const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    
    const db = client.db();
    const collection = db.collection(COLLECTION);
    
    console.log(colors.cyan('Conectado a la base de datos. Mostrando logs recientes:'));
    
    // Mostrar logs recientes
    const recentLogs = await collection.find()
      .sort({ timestamp: -1 })
      .limit(TAIL_SIZE)
      .toArray();
    
    recentLogs.reverse().forEach(log => {
      console.log(formatLog(log));
    });
    
    console.log(colors.cyan('--- Inicio de monitoreo en tiempo real ---'));
    
    // Monitorear cambios
    const changeStream = collection.watch();
    
    changeStream.on('change', change => {
      if (change.operationType === 'insert') {
        console.log(formatLog(change.fullDocument));
      }
    });
    
    // Manejar cierre
    process.on('SIGINT', async () => {
      await changeStream.close();
      await client.close();
      console.log(colors.cyan('\nDesconectado de la base de datos'));
      process.exit(0);
    });
    
  } catch (error) {
    console.error(colors.red('Error:', error));
    process.exit(1);
  }
}

// Iniciar monitoreo
watchLogs();