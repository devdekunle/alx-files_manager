const express = require('express');
const routes = require('./routes/index');

const app = express();
const host = '0.0.0.0';
const port = process.env.PORT || 5000;
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/', routes);

app.listen(port, host, () => {
  console.log(`Server running on ${port}`);
});
module.exports = app;
