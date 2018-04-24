// processing data and stuffing it all into features
function generateFeatures(topo_json, state_id, listings_data, state_jobs, job_categories) {
  // change array into obj with ID as key to easily add to features
  var state_id_invert = invertStateId(state_id);
  logger.dev('STATE_ID_INVERT');
  logger.dev(state_id_invert);
  
  // create features from topo_json and add additional data
  var feats = topojson.feature(topo_json, topo_json.objects.states).features;
  feats.forEach(function(x) {
    x.state_ab = state_id_invert[x.id].state_ab;
    x.state_name = state_id_invert[x.id].state_name;
    x.job_detail = [];
    x.jobs = JSON.stringify((state_jobs[x.state_ab] === undefined ? {'total':0} : state_jobs[x.state_ab]));
  });
  logger.dev('FEATURES');
  logger.dev(feats);
  
  // some listings have no category. Make sure to account for this
  //listings_data.forEach(x => logger.dev(x.category_info == ''));
  
  logger.dev(listings_data[0].job_description);
  logger.dev(getLemmasFromDesc(listings_data[0].job_description));
  
  // add each job w/ categories and lemmas to respective state
  addJobDetails(feats, listings_data);
  
  return feats;
}

function createVis(errors, topo_json, state_id, listings_data, state_jobs, job_categories)  {
  logger.dev('TOPO_JSON');
  logger.dev(topo_json);
  
  logger.dev('STATE_ID');
  logger.dev(state_id);
  
  logger.dev('LISTINGS_DATA');
  logger.dev(listings_data);
  
  logger.dev('STATE_JOBS');
  logger.dev(state_jobs);
  
  logger.dev('JOB_CATEGORIES');
  logger.dev(job_categories);
  
  var width = 960;
  var height = 600;
  
  var projection = d3.geoAlbersUsa().scale(1000);
  var path = d3.geoPath();
  var features = generateFeatures(topo_json, state_id, listings_data, state_jobs, job_categories);
  
  logger.dev('FEATURES');
  logger.dev(features);
  foobar = listings_data;
  
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

// add each job w/ categories and lemmas to respective state
function addJobDetails(feats, listings) {
  listings.forEach(function(listing) {
    // replace empty string category with text empty for later filtering
    var cats = listing.category_info.split(',').map(x => (x === '' ? 'empty' : x));
    
    var feat = getFeatByAbbreviation(feats, listing.state);
    feat.job_detail.push({
      'categories': cats,
      'lemmas': getLemmasFromDesc(listing.job_description)
    });
  });
}

function getFeatByAbbreviation(feats, abbr) {
  var index = feats.findIndex(x => x.state_ab === abbr);
  if(index < 0) {
    logger.error('State abbreviation "' + abbr + '" not found in Feature array');
  }
  
  return feats[index];
}

// change array into obj with ID as key to easily add to features
function invertStateId(state_id) {
  var invert = {};
  state_id.forEach(function(x) {
    invert[x.STATE] = {
      state_ab: x.STUSAB,
      state_name: x.STATE_NAME
    };
  });
  
  return invert;
}

// get lemmas from job description
function getLemmasFromDesc(desc) {
  var desc_plain = getPlainText(desc);
  var desc_arr = removeStopwords(desc_plain.split(' '));
  
  // use set so don't need to remove dupes later
  var lemma_set = new Set();
  desc_arr.forEach(function(x) {
    lemmatizer.only_lemmas(x).forEach(x => lemma_set.add(x));
  });
  
  return Array.from(lemma_set);
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
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/state_jobs.json")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/global/data/job_categories.json")
    .await(createVis);
}

var lemmatizer = new Lemmatizer();
var logger = new Logger();
logger.setLogLevel(logger.LogLevel.DEV);

window.onload = projectLoad;

var foobar;
