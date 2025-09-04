const mongoose = require('mongoose');

module.exports = async () => {
  // Clean up all mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Force close any remaining connections
  await mongoose.connection.close();
  
  // Additional cleanup for any background processes
  if (global.gc) {
    global.gc();
  }
};