// modules/index.js
const fs = require('fs');
const path = require('path');

const initializeModules = (app) => {
  const modulesDir = __dirname;

  fs.readdirSync(modulesDir).forEach(file => {
    const modulePath = path.join(modulesDir, file);

    if (file !== 'index.js' && fs.lstatSync(modulePath).isFile() && path.extname(file) === '.js') {
        const module = require(modulePath);
        if (module.assignRoutes) {
            module.assignRoutes(app);
        }
    }
  });
};

module.exports = initializeModules;
