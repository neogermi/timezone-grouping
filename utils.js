const moment = require('moment-timezone');
const orderBy = require('lodash.orderby');
const uniq = require('lodash.uniq');

const { cityTranslations } = require('./config');

const CONTINENT_ALLOWLIST = [
  'Europe',
  'Asia',
  'America',
  'America/Argentina',
  'Africa',
  'Australia',
  'Pacific',
  'Atlantic',
  'Antarctica',
  'Arctic',
  'Indian',
];

const LABELS_DENYLIST = [
  'Australia/West',
  'Australia/South',
  'America/North_Dakota/Center',
];

const _getDates = (startDate, numDays) => {
  const dateArray = [];

  const momentStart = moment(startDate);

  for (let i = 0; i <= numDays; i++) {
    dateArray.push(momentStart.clone().add(i, 'days').format('YYYY-MM-DD'));
  }

  return dateArray;
};

const _extractContinent = label => {
  if (label.indexOf('Istanbul') !== -1) {
    return 'Europe';
  }

  const lastIndex = label.lastIndexOf('/');
  return (lastIndex === -1 ? label : label.substr(0, lastIndex));
}

const _isRegularContinent = continent => CONTINENT_ALLOWLIST.includes(continent);

const generateMappedDB = (database, startDate, numDays) => {
  console.log(`Initializing data starting ${startDate} with ${numDays} days in the future, comparing ${database.length} timezones`);

  const theDates = _getDates(startDate, numDays);
  return database.map(d => {
    const continent = _extractContinent(d.label);
    return {
      ...d,
      continent,
      isRegularContinent: _isRegularContinent(continent),
      dates: theDates.map(date => moment.tz(date, d.label).utc().format()),
    }
  });
};

const compareDateArrs = (arr1, arr2) => arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);

const _extractCity = label => {
  if (cityTranslations[label]) {
    return cityTranslations[label];
  }

  if (label.indexOf('Etc/') === 0 || LABELS_DENYLIST.includes(label)) {
    return label;
  }

  const lastIndex = label.lastIndexOf('/');
  return (lastIndex === -1 ? label : label.substr(lastIndex + 1)).replace(/[\W_]/g, ' ');
}

const calculateGroupLabel = (rawTZs, max = 5) => {
  rawTZs = orderBy(rawTZs, 'count', 'desc');

  const shrinkedTZs = rawTZs.filter(({ label }) => _isRegularContinent(_extractContinent(label)));
  rawTZs = shrinkedTZs.length === 0 ? [rawTZs[0]] : shrinkedTZs;

  const uniqueLabels = uniq(
      rawTZs
      .map(({ label }) => _extractCity(label))
      .filter(_ => !!_)
    );

  return uniqueLabels
    .slice(0, max)
    .join(', ');
}

module.exports = {
  generateMappedDB,
  compareDateArrs,
  calculateGroupLabel,
};
