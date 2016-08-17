var LocalTime = require('triplet-core/local-time.js')
var dtString = require('triplet-core/util/client-util.js').dtString
var PAST_TRIP_SEARCH_TIME = 300000

exports.trips = function (query, config) {
  var params = {
    key: config.apiKeys.trips,
    encoding: 'utf-8',
    numTrips: query.maxResults || 6,
    realtime: true
  }

  var from = query.from
  var to = query.to

  if (from.id) {
    params.originId = from.id
  } else {
    params.originCoordname = from.name
    params.originCoordLat = from.location.latitude
    params.originCoordLong = from.location.longitude
  }

  if (to.id) {
    params.destId = to.id
  } else {
    params.destCoordName = to.name
    params.destCoordLat = to.location.latitude
    params.destCoordLong = to.location.longitude
  }

  var localDate = LocalTime.get()
  var date = query.date || new Date(localDate.getTime() - PAST_TRIP_SEARCH_TIME)

  params.date = [
    date.getFullYear(),
    dtString(date.getMonth() + 1),
    dtString(date.getDate())
  ].join('-')

  params.time = dtString(date.getHours()) + ':' + dtString(date.getMinutes())

  if (query.quickMode) {
    params.minChgTime = 1
  }
  return params
}

exports.nearbyStations = function (query, config) {
  var location = query.location
  var params = {
    key: config.apiKeys.nearbystations
  }

  if (location) {
    params.originCoordLat = location.latitude
    params.originCoordLong = location.longitude
  }

  params.radius = query.radius || 3000
  params.maxResults = query.resultMaxCount || 50

  return params
}

exports.stations = function (query, config) {
  return {
    key: config.apiKeys.stations,
    stationsonly: false,
    maxresults: query.maxResults || 15,
    searchstring: query.queryString
  }
}
