const express = require('express');
const serverless = require('serverless-http');
const { swaggerUi, specs } = require('./swagger');

const app = express();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = serverless(app);
