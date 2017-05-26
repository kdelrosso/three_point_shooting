// require('./chart_helper.js');
// require('./chart_transitions.js');

var w = 900,
    h = 700,
    margin = {top: 50, left: 50, bottom: 50, right: 150},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom,
    svg = d3.select('div#vizContainer').append('svg')
            .attr('width', w).attr('height', h),
    overallG = svg.append('g').classed('overallG', true)
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
    g = overallG.append('g').classed('chartG', true),
    axisG = overallG.append('g').classed('axisG', true),
    moveTextAbove = ['Michael Jordan', 'Reggie Miller', 'Jason Kidd', 'Tracy McGrady', 'Scottie Pippen']
    regularSeason = true,
    useDate = true,
    yAxisBreakIndex = 4,
    regularSeasonTicks = [0, 500, 1000, 1500, 2000, 2500, 3000],
    playoffTicks = [0, 75, 150, 225, 300, 375],
    dataset = null;

d3.csv('./data/three_point_shooting.csv', type, function(data) {
  dataset = data;
  dataset.forEach(function(el) {
    el.x = el.season_ts;
    el.y = el.total_regular_fg3m;
  })
  threePointShooting(dataset, true, regularSeasonTicks);
});

function threePointShooting(data, dateScale, yTickValues) {

  d3.select('span.regularSeason').style('font-weight', 'bold');
  d3.select('span.year').style('font-weight', 'bold');

  let scales = createScales(data, dateScale),
    xScale = scales.xScale,
    yScale = scales.yScale;

  let yValueLine = d3.svg.line()
    .x(function(d) { return xScale(d.x); })
    .y(function(d) { return yScale(d.y); });

  let nestedById = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data);

  let playerG = g.selectAll('g')
    .data(nestedById, function(d) { return d.key; }).enter()
    .append('g')
    .attr('class', function(d) { return playerClass(d.values); })
    .classed('playerG', true)
    .attr('playerName', function(d) { return d.values[0].name; })
    .attr('yValue', function(d) {
      // cumulative sum thus total messages = max messages
      return d3.max(d.values, function(el) { return el.y; });
    });

  let alwaysShow = g.selectAll('g.alwaysShow');
  let currentPlayer = g.selectAll('g.currentPlayer');
  let featured = g.selectAll('g.featured');

  playerG
    .append('path')
    .classed('halo', true)
    .attr('d', function(d) { return yValueLine(d.values); })
    .style('opacity', 0);

  playerG
    .append('path')
    .classed('player', true)
    .attr('d', function(d) { return yValueLine(d.values); });

  playerG
    .append('circle')
    .classed('player', true)
    .attr('r', 2.5)
    .attr('cx', function(d) {
      return xScale(d3.max(d.values, function(el) { return el.x; }));
    })
    .attr('cy', function(d) {
      return yScale(d3.max(d.values, function(el) { return el.y; }));
    })
    .style('opacity', 0);

  playerTextG = playerG
    .append('g')
    .classed('playerText', true)
    .attr('transform', function(d) {
      let x = xScale(d3.max(d.values, function(el) { return el.x; })) + 5;
      let y = yScale(d3.max(d.values, function(el) { return el.y; })) + 3;
      return 'translate(' + x + ', ' + y + ')';
    })

  playerTextG
    .append('text')
    .classed('halo', true)
    .text('')

  playerTextG
    .append('text')
    .text('')

  playerTextG.filter(function(d) { return include(moveTextAbove, d.values[0].name); })
    .attr('transform', function(d) {
      let x = xScale(d3.max(d.values, function(el) { return el.x; })) + 15;
      let y = yScale(d3.max(d.values, function(el) { return el.y; })) - 7  ;
      return 'translate(' + x + ', ' + y + ')';
    })
    .style('text-anchor', 'middle');

  alwaysShow.selectAll('circle').style('opacity', 1)
  alwaysShow.selectAll('text').text(function(d) { return d.values[0].name; });

  featured.selectAll('circle').style('opacity', 1)
  featured.each(function() {
    d3.select(this).selectAll('text')
      .text(this.getAttribute('playerName') + ' (' + this.getAttribute('yValue') + ')');
  });
  featured.selectAll('text')
    .style('font-weight', 'bold')
    .style('font-size', '12px')
    .style('fill', '#4169E1');

  // bring alwaysShow to the front
  alwaysShow.each(function() { this.parentElement.appendChild(this); });
  featured.each(function() { this.parentElement.appendChild(this); });

  var previousThis = null;
  var clickedPaths = [];
  playerG
    .on('mouseover', function() {
      // bring alwaysShow to the front
      alwaysShow.each(function() { this.parentElement.appendChild(this); });
      featured.each(function() { this.parentElement.appendChild(this); });

      // mouseout previous this
      if (previousThis && !include(clickedPaths, previousThis)) {
        if (!d3.select(previousThis).classed('featured')) {
          if (d3.select(previousThis).classed('alwaysShow currentPlayer')) {
            d3.select(previousThis).selectAll('text')
              .text(previousThis.getAttribute('playerName'));
            d3.select(previousThis).select('path.player').style('stroke', '#4169E1');
            d3.select(previousThis).select('circle').style('fill', '#4169E1');
          } else if (d3.select(previousThis).classed('alwaysShow')) {
            d3.select(previousThis).selectAll('text')
              .text(previousThis.getAttribute('playerName'));
            d3.select(previousThis).select('path.player').style('stroke', '#2F4F4F');
            d3.select(previousThis).select('circle').style('fill', '#2F4F4F');
          } else {
            let pathColor = d3.select(previousThis).classed('currentPlayer') ? '#87CEFA' : '#D3D3D3'
            d3.select(previousThis).selectAll('text').text('');
            d3.select(previousThis).select('circle').style('opacity', 0);
            d3.select(previousThis).select('path.player').style('stroke', pathColor);
          }

          d3.select(previousThis).select('path.player').style('stroke-width', 1);
          d3.select(previousThis).select('path.halo').style('opacity', 0);
        }
      }

      previousThis = this;
      if (!d3.select(previousThis).classed('featured')) {
        var hoverColor = d3.select(this).classed('currentPlayer') ? '#4169E1' : 'black';
        d3.select(this).selectAll('text')
          .text(this.getAttribute('playerName') + ' (' + this.getAttribute('yValue') + ')');
        d3.select(this).select('circle').style('opacity', 1).style('fill', hoverColor);
        d3.select(this).select('path.player').style('stroke', hoverColor).style('stroke-width', 2);
      }
      d3.select(this).select('path.halo').style('opacity', 1);
      this.parentElement.appendChild(this);
    })
    .on('click', function() {
      // only add node to array once, remove node if clicked again
      if ( include(clickedPaths, this) ) {
        var index = clickedPaths.indexOf(this);
        clickedPaths.splice(index, 1);
      } else if (!d3.select(this).classed('featured')){
        clickedPaths.push(this);
        previousThis = null;
      }
    })

  buildAxes(xScale, yScale, axisG, yTickValues);
}

d3.select('span.regularSeason')
  .on('click', function() {
    d3.select(this).style('font-weight', 'bold');
    d3.select('span.playoffs').style('font-weight', 'normal');
    regularSeason = true;

    if (useDate) {
      dataset.forEach(xyFunction('ts-regular-fg3m'));
      updateChartData(dataset, true, regularSeasonTicks);
    } else {
      dataset.forEach(xyFunction('number-regular-fg3m'));
      updateChartData(dataset, false, regularSeasonTicks);
    }
  });

d3.select('span.playoffs')
  .on('click', function() {
    d3.select(this).style('font-weight', 'bold');
    d3.select('span.regularSeason').style('font-weight', 'normal');
    regularSeason = false;

    if (useDate) {
      dataset.forEach(xyFunction('ts-playoffs-fg3m'));
      updateChartData(dataset, true, playoffTicks);
    } else {
      dataset.forEach(xyFunction('number-playoffs-fg3m'));
      updateChartData(dataset, false, playoffTicks);
    }
  });

d3.select('span.year')
  .on('click', function() {
    d3.select(this).style('font-weight', 'bold');
    d3.select('span.seasonNum').style('font-weight', 'normal');
    useDate = true;

    if (regularSeason) {
      dataset.forEach(xyFunction('ts-regular-fg3m'));
      updateChartTime(dataset, true, regularSeasonTicks);
    } else {
      dataset.forEach(xyFunction('ts-playoffs-fg3m'));
      updateChartTime(dataset, true, playoffTicks);
    }
  });

d3.select('span.seasonNum')
  .on('click', function() {
    d3.select(this).style('font-weight', 'bold');
    d3.select('span.year').style('font-weight', 'normal');
    useDate = false;

    if (regularSeason) {
      dataset.forEach(xyFunction('number-regular-fg3m'));
      updateChartTime(dataset, false, regularSeasonTicks);
    } else {
      dataset.forEach(xyFunction('number-playoffs-fg3m'));
      updateChartTime(dataset, false, playoffTicks);
    }
  });

// Imported code

// ./chart_helper.js

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

// ./chart_transitions.js

var transitionTime = 1000;

function updateChartTime(data, dateScale) {

  let scales = createScales(data, dateScale),
    xScale = scales.xScale,
    yScale = scales.yScale;

  let yValueLine = d3.svg.line()
    .x(function(d) { return xScale(d.x); })
    .y(function(d) { return yScale(d.y); });

  let nestedById = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data);

  let playerG = g.selectAll('g.playerG')
    .data(nestedById, function(d) { return d.key; });

  playerG.select('path.halo')
    .transition().duration(transitionTime)
    .attr('d', function(d) { return yValueLine(d.values); });

  playerG.select('path.player')
    .transition().duration(transitionTime)
    .attr('d', function(d) { return yValueLine(d.values); });

  playerG.select('circle')
    .transition().duration(transitionTime)
    .attr('cx', function(d) {
      return xScale(d3.max(d.values, function(el) { return el.x; }));
      // return xScaleSeasonNum(d3.max(d.values, function(el) { return el.season_number; }));
    })
    .attr('cy', function(d) {
      return yScale(d3.max(d.values, function(el) { return el.y; }));
    });

  playerTextG = playerG.select('g.playerText')
    .transition().duration(transitionTime)
    .attr('transform', function(d) {
      let x = xScale(d3.max(d.values, function(el) { return el.x; })) + 5;
      let y = yScale(d3.max(d.values, function(el) { return el.y; })) + 3;
      return 'translate(' + x + ', ' + y + ')';
    })

  playerTextG.filter(function(d) { return include(moveTextAbove, d.values[0].name); })
    .attr('transform', function(d) {
      let x = xScale(d3.max(d.values, function(el) { return el.x; })) + 15;
      let y = yScale(d3.max(d.values, function(el) { return el.y; })) - 7  ;
      return 'translate(' + x + ', ' + y + ')';
    })
    .style('text-anchor', 'middle');

  g.selectAll('g.featured').each(function() {
    d3.select(this).selectAll('text')
      .text(this.getAttribute('playerName') + ' (' + this.getAttribute('yValue') + ')');
  });

  updateXAxes(xScale);
}

function updateXAxes(xScale) {
  var xAxis = d3.svg.axis().scale(xScale).orient('bottom');

  axisG.select('g.x.axis')
    .call(xAxis);

  axisG.selectAll('path.domain').remove();

  axisG.select('g.x.axis').selectAll('g.tick text')
    .style('opacity', 0)
    .transition().duration(transitionTime)
    .style('opacity', 1);
}

function updateChartData(data, dateScale, yTickValues) {

  let scales = createScales(data, dateScale),
    xScale = scales.xScale,
    yScale = scales.yScale;

  let yValueLine = d3.svg.line()
    .x(function(d) { return xScale(d.x); })
    .y(function(d) { return yScale(d.y); });

  let nestedById = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data);

  let playerG = g.selectAll('g.playerG')
    .data(nestedById, function(d) { return d.key; })
    .attr('playerName', function(d) { return d.values[0].name; })
    .attr('yValue', function(d) {
      // cumulative sum thus total messages = max messages
      return d3.max(d.values, function(el) { return el.y; });
    });

  // UPDATE old elements
  playerG.select('path.halo')
    .transition().duration(transitionTime)
    .attr('d', function(d) { return yValueLine(d.values); });

  playerG.select('path.player')
    .transition().duration(transitionTime)
    .attr('d', function(d) { return yValueLine(d.values); });

  playerG.select('circle')
    .transition().duration(transitionTime)
    .attr('cx', function(d) {
      return xScale(d3.max(d.values, function(el) { return el.x; }));
      // return xScaleSeasonNum(d3.max(d.values, function(el) { return el.season_number; }));
    })
    .attr('cy', function(d) {
      return yScale(d3.max(d.values, function(el) { return el.y; }));
    });

  playerTextG = playerG.select('g.playerText')
    .transition().duration(transitionTime)
    .attr('transform', function(d) {
      let x = xScale(d3.max(d.values, function(el) { return el.x; })) + 5;
      let y = yScale(d3.max(d.values, function(el) { return el.y; })) + 3;
      return 'translate(' + x + ', ' + y + ')';
    })

  playerTextG.filter(function(d) { return include(moveTextAbove, d.values[0].name); })
    .attr('transform', function(d) {
      let x = xScale(d3.max(d.values, function(el) { return el.x; })) + 15;
      let y = yScale(d3.max(d.values, function(el) { return el.y; })) - 7  ;
      return 'translate(' + x + ', ' + y + ')';
    })
    .style('text-anchor', 'middle');

  g.selectAll('g.featured').each(function() {
    d3.select(this).selectAll('text')
      .text(this.getAttribute('playerName') + ' (' + this.getAttribute('yValue') + ')');
  });

  yAxisG = axisG.select('g.y.axis');
  yAxisG.transition().duration(transitionTime).call(function(g) {
    updateYAxes(g, yScale, yTickValues)
  });
  // updateYAxes(yScale, yTickValues);
}

function updateYAxes(yAxisG, yScale, yTickValues) {

  var yAxis = d3.svg.axis().scale(yScale).orient('right')
    .tickSize(width)
    .tickValues(yTickValues)
    .tickFormat(function(d) {
      var commasFormatter = d3.format(",.0f")
      return d === yTickValues[yAxisBreakIndex] ? commasFormatter(d) + ' - 3pt field goals made' : commasFormatter(d);
    });

  yAxisG.call(yAxis);
  yAxisG.select('path.domain').remove();
  yAxisG.selectAll('.tick line')
    .filter(Number).style('stroke', '#777').style('stroke-dasharray', '2,2');

  yAxisG.selectAll('.tick text').attr('x', 4).attr('dy', -4);

  // remove zero from axis
  yAxisG.selectAll(".tick text").filter(function(el) { return el === 0; }).remove()

  shortenAxisG = yAxisG.selectAll('g')
      .filter(function(el) { return el >= yTickValues[yAxisBreakIndex + 1]; });

  shortenAxisG.selectAll('line').attr('x1', width / 2);
  shortenAxisG.selectAll('text').attr('x', width / 2 + 4);

  // yAxisG.selectAll(".tick text").attrTween("x", 4).attrTween("dy", -4);
}
