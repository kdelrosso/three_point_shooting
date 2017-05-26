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
