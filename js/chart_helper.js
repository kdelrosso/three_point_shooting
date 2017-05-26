
function include(arr, obj) {
  return (arr.indexOf(obj) != -1);
}

function type(d) {
  let p = {}
  p.id = +d.player_id;
  p.total_regular_fg3m = +d.total_regular_fg3m;
  p.total_regular_pts = +d.total_regular_pts;
  p.total_playoffs_fg3m = +d.total_playoffs_fg3m;
  p.total_playoffs_pts = +d.total_playoffs_pts;
  p.season_number = +d.season_number;
  p.year = +d.season_ts.substring(0, 4);
  p.name = d.firstname + ' ' + d.lastname
  p.season_ts = new Date(d.season_ts);
  return p;
}

function playerClass(arr) {
  var featuredPlayers = ['Stephen Curry', 'Klay Thompson'];
  var keyPlayers = ['Ray Allen', 'Reggie Miller', 'Jason Terry', 'Paul Pierce', 'Vince Carter', 'Jason Kidd', 'Kobe Bryant', 'Dirk Nowitzki',
  'Peja Stojakovic', 'Dale Ellis', 'Steve Nash', 'James Harden', 'LeBron James', 'Glen Rice', 'Robert Horry',
  'Kevin Durant', 'Tracy McGrady', 'Scottie Pippen', 'Dominique Wilkins', 'Larry Bird', 'Dell Curry',
  'Michael Jordan', 'Charles Barkley', 'Magic Johnson', 'Russell Westbrook', 'Clyde Drexler', 'Damian Lillard'];
  var playerName = arr[0].name;
  var alwaysShow = include(keyPlayers, playerName) ? 'alwaysShow' : '';

  lastYear = d3.max(arr, function(el) { return el.year; });
  var currentPlayer = lastYear === 2016 ? 'currentPlayer' : '';

  return include(featuredPlayers, playerName) ? 'featured' : alwaysShow + ' ' + currentPlayer;
}

function createScales(data, dateScale) {
  if (dateScale) {
    var yearStartEnd = d3.extent(data, function(d) { return d.x; }),
        xScale = d3.time.scale().domain(yearStartEnd).range([0, width]);
  } else {
    var maxX = d3.max(data, function(d) { return d.x; }),
      xScale = d3.scale.linear().domain([0, maxX]).range([0, width]);
  }

  var maxY = d3.max(data, function(d) { return d.y; }),
      yScale = d3.scale.linear().domain([0, maxY]).range([height, 0]);

  return {'xScale': xScale, 'yScale': yScale}
}

/*
Build x and y axis elements in axisG

Parameters
----------
xScale, yScale: d3.scale functions
yTickValues: array, tick values for the y axis.
  Regular Season: Use [0, 500, 1000, 1500, 2000, 2500, 3000]
  Playoffs: Use [0, 75, 150, 225, 300, 375]
yAxisBreakIndex: int, location to break / shorten y axis grid lines

Notes
-----
https://bl.ocks.org/mbostock/4323929
https://bl.ocks.org/mbostock/3371592
*/
function buildAxes(xScale, yScale, axisG, yTickValues=[0, 500, 1000, 1500, 2000, 2500, 3000]) {

  var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis().scale(yScale).orient('right')
    .tickSize(width)
    .tickValues(yTickValues)
    .tickFormat(function(d) {
      var commasFormatter = d3.format(",.0f")
      return d === yTickValues[yAxisBreakIndex] ? commasFormatter(d) + ' - 3pt field goals made' : commasFormatter(d);
    });

  axisG.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0, '+ height +')')
    .call(xAxis);

  axisG.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  axisG.selectAll('path.domain').remove();

  // .filter(Number) filters out zero
  axisG.select('g.y.axis').selectAll('.tick line')
    .filter(Number).style('stroke', '#777').style('stroke-dasharray', '2,2');
  axisG.select('g.y.axis').selectAll(".tick text").attr("x", 4).attr("dy", -4);

  // remove zero from axis
  axisG.select('g.y.axis').selectAll(".tick text").filter(function(el) { return el === 0; }).remove()

  shortenAxisG = axisG.select('g.y.axis').selectAll('g')
      .filter(function(el) { return el >= yTickValues[yAxisBreakIndex + 1]; });

  shortenAxisG.selectAll('line').attr('x1', width / 2);
  shortenAxisG.selectAll('text').attr('x', width / 2 + 4);
}

/*
We have 2^3 = 8 combinations.

Parameters
----------
combination: string, '[ts or number]-[regular or playoffs]-[fg3m or pts]'
*/
function xyFunction(combination) {

switch(combination) {
  case 'ts-regular-fg3m':
    return function(el) { el.x = el.season_ts; el.y = el.total_regular_fg3m; }
    break;
  case 'ts-playoffs-fg3m':
    return function(el) { el.x = el.season_ts; el.y = el.total_playoffs_fg3m; }
    break;
  case 'number-regular-fg3m':
    return function(el) { el.x = el.season_number; el.y = el.total_regular_fg3m; }
    break;
  case 'number-playoffs-fg3m':
    return function(el) { el.x = el.season_number; el.y = el.total_playoffs_fg3m; }
    break;
  case 'ts-regular-pts':
    return function(el) { el.x = el.season_ts; el.y = el.total_regular_pts; }
    break;
  case 'ts-playoffs-pts':
    return function(el) { el.x = el.season_ts; el.y = el.total_playoffs_pts; }
    break;
  case 'number-regular-pts':
    return function(el) { el.x = el.season_number; el.y = el.total_regular_pts; }
    break;
  case 'number-playoffs-pts':
    return function(el) { el.x = el.season_number; el.y = el.total_playoffs_pts; }
    break;
  }
}



