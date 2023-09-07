const express = require('express');
const routes = require('./routes/index');

const app = express();
const host = '0.0.0.0';
const port = process.env.PORT || 5000;
app.use('/', routes);

app.listen(port, host, () => {
  console.log(`Server running on ${port}`);
});
module.exports = app;
