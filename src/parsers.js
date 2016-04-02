var Station = require('triplet-core//trip-models/station');
var GeoPoint = require('triplet-core//trip-models/geopoint');
var Trip = require('triplet-core//trip-models/trip');
var Leg = require('triplet-core//trip-models/leg');
var LegStop = require('triplet-core//trip-models/leg-stop');
var Carrier = require('triplet-core//trip-models/carrier.js');
var Line = require('triplet-core//trip-models/line');
var Location = require('triplet-core//trip-models/location');
var Utils = require('triplet-core/util/client-util.js');
var forceArray = Utils.forceArray;
var parseDate = Utils.parseLocalDate;

var lineColors = require('./line-colors.json');

var types = Carrier.Types;
var vtTypes = {
  'METRO': types.metro,
  'BUS': types.bus,
  'NARBUSS': types.bus,
  'TRAIN': types.commuterTrain,
  'TRAM': types.tram,
  'SHIP': types.boat,
  'FERRY': types.boat,
  'WALK': types.walk,
  'BIKE': types.bike,
  'TAXI': types.taxi,
};

exports.stationsError = function stationsError(json) {
  return (json.StatusCode !== 0) ? json.Message : null;
};

exports.stations = function stations(json) {
  var data = json.ResponseData;
  return (!data) ? [] : forceArray(data).map(station);
};

exports.nearbyStations = function nearbyStations(json) {
  var data = json.LocationList;

  return (!data) ? [] : forceArray(data.StopLocation).map(station);
};

exports.nearbyStationsError = function nearbyStationsError(json) {
  return (json.StatusCode !== undefined) ? json.Message : null;
};

exports.tripsError = function tripsError(json) {
  return json.TripList.errorText || null;
};

exports.trips = function(json) {
  var data = json.TripList;
  return (!data) ? [] : forceArray(data.Trip).map(trip);
};

function station(json, parseArea) {
  // Check if station is actually an address/POI
  if (!json.id && (!json.SiteId || json.SiteId === '0')) {
    return location(json);
  }

  var name = json.name || json.Name, area;

  if (parseArea !== false) {
    var startIndex = name.lastIndexOf('(');

    if (startIndex > 0) {
      var endIndex = name.lastIndexOf(')');
      area = name.substring(startIndex + 1, endIndex);
      name = name.substring(0, startIndex - 1);
    }
  }

  return new Station({
    id: json.SiteId || json.id + '',
    name: name,
    area: area,
    location: coordinate(json),
    clientId: 'sl'
  });
}

function location(json) {
  var name, area;

  if (json.Name) {
    var c = json.Name.split(', ');
    name = c[0];
    area = c[1];
  }

  return new GeoPoint({
    name: name || json.name,
    area: area,
    location: coordinate(json)
  });
}

function coordinate(json) {
  var lat = json.Y ? (json.Y / 1000000) : (json.Latitude || json.lat);
  var lng = json.X ? (json.X / 1000000) : (json.Longitude || json.lon);

  return (lat && lng) ? new Location({
    latitude: lat,
    longitude: lng
  }) : undefined;
}

function trip(json) {
  return new Trip({
    legs: forceArray(json.LegList.Leg).map(leg).filter(function (i) { return i; }),
    messages: tariffMessages(json)
  });
}

function leg(json) {
  if (json.type === 'WALK' && json.Origin.name === json.Destination.name) {
    return null;
  }

  return new Leg({
    from: legStop(json.Origin),
    to: legStop(json.Destination),
    carrier: carrier(json),
    messages: messages(json)
  });
}

function legStop(json) {
  return new LegStop({
    point: station(json, false),
    track: json.track,
    plannedDate: date(json),
    realTimeDate: realtimeDate(json),
    messages: messages(json)
  });
}

function carrier(json) {
  return new Carrier({
    name: carrierName(json.name),
    heading: json.dir,
    type: carrierType(json.type),
    line: line(json),
    flags: {
      details: json.JourneyDetailRef
    }
  });
}

function carrierName(name) {
  if (!name) { return undefined; }

  name = name
    .replace('tunnelbanans röda linje', 'Röd linje')
    .replace('tunnelbanans gröna linje', 'Grön linje')
    .replace('tunnelbanans blå linje', 'Blå linje');

  return name.charAt(0).toUpperCase() + name.slice(1);
}

function carrierType(type) {
  return vtTypes[type] || types.unknown;
}

function date(json) {
  return parseDate(json.date, json.time);
}

function realtimeDate(json) {
  return parseDate(json.rtDate, json.rtTime);
}

function line(json) {
  var lineString = json.line + '';
  var lineNumber = parseInt(lineString);

  return new Line({
    name: lineString,
    colorFg: fgColor(lineNumber),
    colorBg: bgColor(lineString)
  });
}

function fgColor(line) {
  return (line < 20 || (line > 34 && line < 39)) ? '#ffffff' : '#555555';
}

function bgColor(lineString) {
  return lineColors[lineString] || '#AEAEB2';
}

function messages(json) {
  var msgs = [];

  if (json.Notes) {
    msgs = msgs.concat(forceArray(json.Notes.Note).map(message));
  }

  if (json.RTUMessages) {
    msgs = msgs.concat(forceArray(json.RTUMessages.RTUMessage).map(message));
  }

  return msgs;
}

function message(json) {
  return json.$;
}

function tariffMessages(json) {
  if (json.PriceInfo && json.PriceInfo.TariffMessages) {
    return forceArray(json.PriceInfo.TariffMessages.TariffMessage).map(message);
  }

  return [];
}
