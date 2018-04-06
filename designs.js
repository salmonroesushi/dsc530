function createVis(errors, map_data, state_abbrev, listings_data, state_jobs, job_categories)  {
  var features = map_data.features;
  //console.log(features);
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
  
  // add additional properties to geoJSON features
  map_data.features.forEach(function(feature) {
    feature.properties['JOBS'] = (state_counts[feature.properties.NAME] === undefined ? {total: 0} : state_counts[feature.properties.NAME]);
    feature.properties['ABBREVIATION'] = state_invert[feature.properties.NAME];
  });
  
  // initial color scale using absolute jobs
  /*
  val_range = d3.extent(map_data.features.map(x => x.properties.JOBS.total));
  color_scale = d3.scaleSequential(d3.interpolateReds)
    .domain(val_range);
  */
  color_scale = getColorScale(map_data, 'total');
  
  // define variables used later
  // create leaflet map using map_data
  map = new L.Map('leaflet_map', {
    center: [39, -96],
    zoom: 4,
    zoomControl: false,
    doubleClickZoom: false
  });
  map.addLayer(new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
  
  // add zoom button to bottomleft corner
  //L.control.zoom({position: 'bottomleft'}).addTo(map);
  map.addControl(new L.control.zoom({position: 'bottomleft'}));
  
  // add map_data to leaflet map
  geojson = L.geoJson(map_data, {
    style: featureStyle,
    onEachFeature: featureEvents
  });
  geojson.addTo(map);
  
  // add additional data for each state on the path
  // can't do inside onEachFeature because path is undefined
  geojson.eachLayer(function(layer) {
    layer._path.setAttribute('state', layer.feature.properties.NAME);
    layer._path.setAttribute('job_total', layer.feature.properties.JOB_TOTAL);
  });
  
  // adding custom control to select job categories
  filter_control = createFilterControl(map, map_data, job_categories);
  filter_control.addTo(map);
}

function getColorScale(map_data, category) {
  var range = d3.extent(map_data.features.map(x => x.properties.JOBS[category]));
  var scale = d3.scaleSequential(d3.interpolateReds)
    .domain(range);
  
  return scale;
}

function updateMapCategory(map_data, category)
{
  if(category === 'none') {
    category = 'total';
  }
  var scale = getColorScale(map_data, category);
  
  geojson.eachLayer(function(layer) {
    layer.setStyle( {
      fillColor: scale((layer.feature.properties.JOBS[category] === undefined ? 0 : layer.feature.properties.JOBS[category])),
      fillOpacity: 1.0
    });
  });
}

function createFilterControl(map, map_data, categories) {
  var control = L.control({position: 'topright'});
  
  control.onAdd = function(map) {
    this._div = filterControlBody(map_data, categories);
    return this._div;
  };
  
  return control;
}

function filterControlBody(map_data, categories) {
  // create DOM elements
  var filter = L.DomUtil.create('div', 'job_filter');
  
  // text
  var heading = L.DomUtil.create('h4');
  heading.innerText = 'Select a job category';
  filter.appendChild(heading);
  
  // add dropdown and options
  var dropdown = L.DomUtil.create('select');
  dropdown.id = 'job_category_dropdown';
  
  // add a default None option for category dropdown
  var cat_none = L.DomUtil.create('option');
  cat_none.setAttribute('value', 'none');
  cat_none.innerText = 'None';
  dropdown.appendChild(cat_none);
  cat_none.selected = true;
  
  // add options for all job categories
  categories.forEach(function(key) {
    var cat = key.replace(/-/g, ' ').replace(/^(.)|\s(.)/g, m => m.toUpperCase());
    var cat_opt = L.DomUtil.create('option');
    cat_opt.setAttribute('value', key);
    cat_opt.innerText = cat;
    dropdown.appendChild(cat_opt);
  });
  
  dropdown.addEventListener('change', function(event) {
    var cat_selected = event.target[event.target.selectedIndex].value;
    updateMapCategory(map_data, cat_selected);
  });
  
  filter.appendChild(dropdown);
  
  return filter;
}

// defining events on geoJSON for each feature/state
function featureEvents(feature, layer) {
  layer.on({
    mouseover: featureMouseover,
    mouseout: featureMouseout,
    //click: clickEvent
  });
}

// defining default style for each feature/state
function featureStyle(feature) {
  return {
    fillColor: color_scale(feature.properties.JOBS.total),
    fillOpacity: 0.5,
    color: 'black',
    weight: 1
  };
}

// on mouseover event
// make state border white and bigger
function featureMouseover(e) {
  var layer = e.target;
  
  layer.setStyle({
    weight: 3,
    color: 'white'
  });
  
  layer.bringToFront();
}

// on mouseout event
// set state border back to thin black default
function featureMouseout(e) {
  //geojson.resetStyle(e.target);
  var layer = e.target;
  
  layer.setStyle({
    weight: 1,
    color: 'black'
  });
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
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/gz_2010_us_040_00_20m.json")
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
