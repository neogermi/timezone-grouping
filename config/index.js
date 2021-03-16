const cityTranslations = require('./cities');
const database = require('./database');

const START_DATE = '2020-01-01';
const NUM_DAYS = 2 * 365;

module.exports = {
  START_DATE,
  NUM_DAYS,
  database,
  cityTranslations,
};
