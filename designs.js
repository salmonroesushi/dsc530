function createVis(errors, topo_json, state_id, listings_data, state_jobs, job_categories)  {
  console.log('TOPO_JSON');
  console.log(topo_json);
  
  console.log('STATE_ID');
  console.log(state_id);
  
  console.log('LISTINGS_DATA');
  console.log(listings_data);
  
  console.log('STATE_JOBS');
  console.log(state_jobs);
  
  console.log('JOB_CATEGORIES');
  console.log(job_categories);
  
  // change array into obj with state_id as key to easily add to features
  state_id_invert = {};
  state_id.forEach(function(x) {
    state_id_invert[x.STATE] = {
      state_ab: x.STUSAB,
      state_name: x.STATE_NAME
    };
  });
  console.log('STATE_ID_INVERT');
  console.log(state_id_invert);
  
  var width = 960;
  var height = 600;
  
  var projection = d3.geoAlbersUsa().scale(1000);
  var path = d3.geoPath();
  var features = topojson.feature(topo_json, topo_json.objects.states).features;
  
  //console.log(topojson.feature(topo_json, topo_json.objects.states));
  
  features.forEach(function(x) {
    x.state_ab = state_id_invert[x.id].state_ab;
    x.state_name = state_id_invert[x.id].state_name;
    x.jobs = JSON.stringify((state_jobs[x.state_ab] === undefined ? {'total':0} : state_jobs[x.state_ab]));
  });
  console.log('FEATURES');
  console.log(features);
  
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
      .attr('d', path);
  
  canvas.append('path')
    .attr('class', 'state-borders')
    .attr('d', path(topojson.mesh(topo_json, topo_json.objects.states, function(a, b) { return a !== b; })));
  
  /*
  var val_range = d3.extent(map_data.features.map(x => x.properties.JOBS.total));
  var color_scale = d3.scaleSequential(d3.interpolateReds)
    .domain(val_range);
  */
  
  console.log(listings_data[0].job_description);
  console.log(getPlainText(listings_data[0].job_description));
  var tmp_str = getPlainText(listings_data[0].job_description);
  console.log(tmp_str.split(' '));
  
  var lemmatizer = new Lemmatizer();
  console.log(lemmatizer.only_lemmas('leaves'));
  
}

function setColorScale(map_data, category) {
  
}

function getPlainText(desc) {
  var tmp = document.createElement('div');
  tmp.innerHTML = desc;
  return tmp.innerText;
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
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/state_jobs.json")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/job_categories.json")
    .await(createVis);
}

window.onload = projectLoad;
