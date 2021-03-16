# How to

1. `npm install`
2a. (OPTIONAL) Adapt `config/database.js` based on the data that you have. (*)
2b. (OPTIONAL) Adapt `config/cities.js` in case you want translations for your city names.
3. Run `npm run start`
4. Result will be printed into a file `result_<now>.js`

*) The script allows numbers for each TZ but you can also leave it empty. They are meant for cases where you want to let them sort by, e.g., number of people that live in the TZ.
