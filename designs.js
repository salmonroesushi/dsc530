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
  
  console.log(listings_data[0].job_description);
  
  var tmp_str = getPlainText(listings_data[0].job_description);
  console.log(tmp_str);
  var tmp_arr = removeStopwords(tmp_str.split(' '));
  console.log(tmp_arr);
  
  var lemmatizer = new Lemmatizer();
  //console.log(lemmatizer.only_lemmas('leaves'));
  
  tmp_arr.forEach(function(x) {
    console.log(JSON.stringify(lemmatizer.only_lemmas(x)));
  });
  
  /*
  var val_range = d3.extent(map_data.features.map(x => x.properties.JOBS.total));
  var color_scale = d3.scaleSequential(d3.interpolateReds)
    .domain(val_range);
  */
}

function setColorScale(map_data, category) {
  
}

// return only text from job description 
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
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/state_jobs.json")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/job_categories.json")
    .await(createVis);
}

window.onload = projectLoad;
