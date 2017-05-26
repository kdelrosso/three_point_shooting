require('./chart_helper.js');
require('./chart_transitions.js');

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


d3.csv('./../data/three_point_shooting.csv', function(data) {
  console.log('first try');
  console.log(data);
});

d3.csv('./data/three_point_shooting.csv', function(data) {
  console.log('second try');
  console.log(data);
});

// d3.csv('./../data/three_point_shooting.csv', type, function(data) {
//   dataset = data;
//   dataset.forEach(function(el) {
//     el.x = el.season_ts;
//     el.y = el.total_regular_fg3m;
//   })
//   threePointShooting(dataset, true, regularSeasonTicks);
// });


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
