var Client = require('triplet-core/client.js')
var parsers = require('./parsers.js')
var urlParams = require('./url-params')

var BASE_URL = 'https://api.sl.se/api2'

module.exports = function (apiKeys, http) {
  return new Client(http, {
    apiKeys: apiKeys,
    shortName: 'sl',
    fullName: 'Storstockholms Lokaltrafik AB',
    params: urlParams,
    parsers: parsers,
    stations: slUrl('/typeahead.json'),
    trips: slUrl('/TravelplannerV3/trip.json'),
    nearbyStations: slUrl('/nearbystops.json'),
    geojson: require('./area.json'),
    supports: {
      realtime: true,
      coordinateSearch: true,
      quickMode: true
    }
  })
}

function slUrl (endpoint) {
  return BASE_URL + endpoint
}
