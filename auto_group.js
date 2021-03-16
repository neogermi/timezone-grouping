const orderBy = require('lodash.orderby');
const fs = require('fs');

const { START_DATE, NUM_DAYS, database } = require('./config');
const utils = require('./utils');

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

const grouping = [];

const mappedDB = utils.generateMappedDB(database, START_DATE, NUM_DAYS);

// we traverse the mappedDB and see if we find matches by comparing each set
// of transformed date for that specific TZ.
mappedDB.forEach(elemI => {
  const { label, continent, isRegularContinent, count = 1, dates } = elemI;

  // ignore if we visited this element already
  if (elemI.visited) {
    return;
  }

  // mark element as already visited
  elemI.visited = true;

  // the grouped timezone that we want as a result
  const newGroup = {
    label: null,
    rawTZs: [ { label, count } ],
    representative: label,
    count,
  };

  mappedDB
  .filter(_ => !_.visited) // only those that we have not yet visited
  .forEach(elemJ => {
    const { label: labelJ, continent: continentJ, isRegularContinent: isRegularContinentJ, count: countJ = 1, dates: datesJ } = elemJ;

    // we define a matching TZ by:
    // 1) if both continents match (avoid grouping Antarctica with anything else)
    // 2) if the transformed dates match in both TZs
    if (
        (continent === continentJ || !isRegularContinentJ)
        && utils.compareDateArrs(dates, datesJ)
      ) {
        newGroup.rawTZs.push({ label: labelJ, count: countJ });
        newGroup.count += countJ;

        // mark element as already visited
        elemJ.visited = true;
    }
  });

  grouping.push(newGroup);
});

// now that we have a group, we want an easy way to find a fitting label for the group
// which is defined as the list of the most-common 7 cities, shown in alphabetical order
const finalGrouping = orderBy(grouping.map(x => ({
  label: utils.calculateGroupLabel(x.rawTZs, 7),
  representative: x.representative,
  count: x.count,
  rawTZs: x.rawTZs.map(_ => _.label).sort(),
})), 'count', 'desc')
.map(({ count, ...rest }) => ({ ...rest })); // remove count from list as not needed for the export

// sanity check
const missingTZs = database.map(x => finalGrouping.find(y => y.rawTZs.indexOf(x.label) > -1) ? null : x.label).filter(_ => !!_);

if (missingTZs.length !== 0) {
  return console.error(`There are ${missingTZs.length} missing timezones. Please check the algorithm.`, missingTZs);
}

// write results into a .js file
const filename = `result_${Date.now()}.js`;
console.log(`I found ${finalGrouping.length} groups. Printing into file ./${filename}`);

const file = fs.createWriteStream(filename);
file.write('module.exports = ' + JSON.stringify(finalGrouping, undefined, 2));
file.end();
