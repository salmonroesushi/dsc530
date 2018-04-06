function createVis(errors, topo_json, state_abbrev, listings_data, state_jobs, job_categories)  {
  console.log(topo_json);
  console.log(state_abbrev);
  console.log(listings_data);
  console.log(state_jobs);
  console.log(job_categories);
  
  // create object with state:jobcount to add to feature properties
  state_counts = mergeAbbrevCount(state_abbrev, state_jobs);
  
  // create object with state:abbrev to add to feature properties
  var state_invert = {};
  for(var key in state_abbrev) {
    state_invert[state_abbrev[key]] = key;
  }
  
  var width = 960;
  var height = 600;
  
  var canvas = d3.select('#svg_map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  var projection = d3.geoAlbersUsa().scale(1000);
  
  var path = d3.geoPath();
  
  canvas.append('g')
    .attr('class', 'states')
    .selectAll('path')
    .data(topojson.feature(topo_json, topo_json.objects.states).features)
    .enter().append('path')
      .attr('d', path);
  
  canvas.append('path')
    .attr('class', 'state-borders')
    .attr('d', path(topojson.mesh(topo_json, topo_json.objects.states, function(a, b) { return a !== b; })));
  
  /*
  var val_range = d3.extent(map_data.features.map(x => x.properties.JOBS.total));
  var color_scale = d3.scaleSequential(d3.interpolateReds)
    .domain(val_range);
  */
}

function setColorScale(map_data, category) {
  
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
  // uncomment the cdn.rawgit.com versions and comment the cis.umassd.edu versions if you require all https data
  d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.json, "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json") // dict with key as abbrev and value as full name
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/listings.csv")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/state_jobs.json")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/job_categories.json")
    .await(createVis);
}

window.onload = projectLoad;

// make everything global for easier debugging
// also so I don't need to cram all those functions in createVis
var map;
var geojson;
var color_scale;
var filter_control;
var state_selected;
var val_range;
