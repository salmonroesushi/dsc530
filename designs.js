function createVis(errors, topo_json, state_id, state_abbrev, listings_data, state_jobs, job_categories)  {
  //console.log(topo_json);
  //console.log(state_id);
  //console.log(state_abbrev);
  //console.log(listings_data);
  //console.log(state_jobs);
  //console.log(job_categories);
  
  // create object with state:jobcount to add to feature properties
  state_counts = mergeAbbrevCount(state_abbrev, state_jobs);
  
  // create object with state:abbrev to add to feature properties
  var state_invert = {};
  for(var key in state_abbrev) {
    state_invert[state_abbrev[key]] = key;
  }
  
  // change array into obj with state_id as key to easily add to features
  state_id_invert = {};
  state_id.forEach(function(x) {
    state_id_invert[x.STATE] = {
      state_ab: x.STUSAB,
      state_name: x.STATE_NAME
    };
  });
  //console.log(state_id_invert);
  
  var width = 960;
  var height = 600;
  
  var projection = d3.geoAlbersUsa().scale(1000);
  var path = d3.geoPath();
  var features = topojson.feature(topo_json, topo_json.objects.states).features;
  
  //console.log(topojson.feature(topo_json, topo_json.objects.states));
  
  features.forEach(function(x) {
    x.state_ab = state_id_invert[x.id].state_ab;
    x.state_name = state_id_invert[x.id].state_name;
  });
  //console.log(features);
  
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

function stateIdToAbbrev(id) {
  
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
  d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/d3only/data/state_id.csv")
    .defer(d3.json, "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json") // dict with key as abbrev and value as full name
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/listings.csv")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/state_jobs.json")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/job_categories.json")
    .await(createVis);
}

window.onload = projectLoad;
