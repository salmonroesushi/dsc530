// main function called after data loaded
function createVis(errors, topo_json, state_id, listings_data)  {
  logger.dev('TOPO_JSON');
  logger.dev(topo_json);
  
  logger.dev('STATE_ID');
  logger.dev(state_id);
  
  logger.dev('LISTINGS_DATA');
  logger.dev(listings_data);
  
  myvis = new MyVis(topo_json, state_id, listings_data);
  myvis.initialize();
  
  var width = 960;
  var height = 600;
  
  var projection = d3.geoAlbersUsa().scale(1000);
  var path = d3.geoPath();
  var features = myvis.features;
  
  logger.dev('FEATURES');
  logger.dev(features);
  
  // create map
  var canvas = d3.select('#svg_map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // can scale the map by adding a transform="scale(0.x)" attribute
  canvas.append('g')
    .attr('class', 'states')
    .selectAll('path')
    .data(features)
    .enter().append('path')
      .attr('state_id', x => x.id)
      .attr('state_ab', x => x.state_ab)
      .attr('state_name', x => x.state_name)
      .attr('jobs', x => x.jobs)
      .attr('d', path)
      .on('mouseover', function(x) {
        d3.select(this).style('fill', 'red');
      })
      .on('mouseout', function(x) {
        d3.select(this).style('fill', 'black');
      });
  
  canvas.append('path')
    .attr('class', 'state-borders')
    .attr('d', path(topojson.mesh(topo_json, topo_json.objects.states, function(a, b) { return a !== b; })));
  
  // change state attr after creating
  canvas.selectAll('g.states>path')
    .data(features)
    .attr('foo', x => x.state_ab);
  
  var job_extent = d3.extent(features.map(x => x.job_detail.length));
  var color_scale = d3.scaleSequential(d3.interpolateReds)
    .domain(job_extent);
  
  canvas.selectAll('g.states>path')
    .data(features)
    .attr('fill', (x => color_scale(x.job_detail.length)));
}

function setColorScale(map_data, category) {
  
}

// return only text from HTML description 
function getPlainText(desc) {
  // get text from HTML body
  var elem = document.createElement('div');
  elem.innerHTML = desc;
  var inner = elem.innerText;
  
  // remove special characters
  inner = inner
               .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ') // replace some unicode whitespaces with a regular one
               .replace(/[\n]/g, ' ') // replace newlines with whitespace
               .replace(/[^a-zA-Z0-9 -]/g, '') // remove non-alphanumeric chars
               .replace(/([a-zA-Z]+)(-)\B/g, '$1') // remove hyphens not followed by chars
               .replace(/\s+/g, ' '); // trim extra whitespaces
  return inner;
}

// turn abbreviation object and state job count object into new object
function mergeAbbrevCount(abbrev, cnt) {
  var keys = Object.keys(cnt);
  var return_obj = {};
  keys.forEach(function(key) {
    return_obj[abbrev[key]] = cnt[key];
  });
  
  return return_obj;
}

function projectLoad() {
  d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/d3only/data/state_id.csv")
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/listings.csv")
    .await(createVis);
}

var lemmatizer = new Lemmatizer();
var logger = new Logger();
logger.setLogLevel(logger.LogLevel.DEV);
var myvis = null;

window.onload = projectLoad;
