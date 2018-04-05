function createVis(errors, map_data, state_abbrev, listings_data, state_cnt, cat_cnt)  {
  var features = map_data.features;
  console.log(features);
  console.log(state_abbrev);
  console.log(listings_data);
  console.log(state_cnt);
  console.log(cat_cnt);
  
  state_counts = mergeAbbrevCount(state_abbrev, state_cnt);
  map_data.features.forEach(function(feature) {
    feature.properties['JOB_TOTAL'] = state_counts[feature.properties.NAME];
  });
  
  var val_range = d3.extent(map_data.features.map(x => x.properties.JOB_TOTAL));
  var color_scale = d3.scaleSequential(d3.interpolateReds)
    .domain(val_range);
  
  // define variables used later
  // create leaflet map using map_data
  var map = new L.Map('leaflet_map', {center: [37, -95], zoom: 4})
    .addLayer(new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
  var geojson;
  var state_selected;
  
  // functions inside functions!
  // to handle events on the features
  
  // defining events on geoJSON for each feature/state
  function featureEvents(feature, layer) {
    layer.on({
      mouseover: featureMouseover,
      mouseout: featureMouseout,
      click: featureClick
    });
  }

  // defining default style for each feature/state
  function featureStyle(feature) {
    return {
      fillColor: color_scale(feature.properties.JOB_TOTAL),
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
  
  // testing click functions
  function featureClick(e) {
    var layer = e.target;
    
    if(state_selected != layer) {
      if(state_selected !== undefined) {
        geojson.resetStyle(state_selected);
      }
      
      layer.setStyle({
        fillColor: 'red',
        fillOpacity: 1
      });
      
      state_selected = layer;
    }
    else {
      geojson.resetStyle(state_selected);
      state_selected = undefined;
    }
    control.update(layer.feature.properties);
  }
  
  // add map_data to leaflet map
  geojson = L.geoJson(map_data, {
    style: featureStyle,
    onEachFeature: featureEvents
  }).addTo(map);
  
  // add additional data for each state on the path
  // can't do inside onEachFeature because path is undefined
  geojson.eachLayer(function(layer) {
    layer._path.setAttribute('state', layer.feature.properties.NAME);
    layer._path.setAttribute('job_total', layer.feature.properties.JOB_TOTAL);
  });
  
  // adding custom control to select job categories
  var control = L.control({position: 'topright'});
  
  control.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'job_filter');
    this.update();
    return this._div;
  }
  
  control.update = function(properties) {
    this._div.innerHTML = '<h3>' + (properties === undefined ? '' : properties.NAME) + '</h3>';
    console.log(properties);
  }
  
  control.addTo(map);
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

// change lat long to points
function projectPoint(map) {
  return function(lng, lat) {
    var point = map.latLngToLayerPoint(new L.latLng(lat, lng));
    this.stream.point(point.x, point.y);
  }
}

// updating SVG map overlay
function updateMap(map, map_data, canvas, group) {
  return function() {
    var transform = d3.geoTransform({point: projectPoint(map)});
    var path = d3.geoPath().projection(transform);
    
    var bounds = path.bounds(map_data);
    
    var boundsTopLeft = bounds[0];
    var boundsBottomRight = bounds[1];
    
    group.selectAll('path')
      .attr('d', path)
      .attr('transform', 'translate(' + -boundsTopLeft[0] + ',' + -boundsTopLeft[1] + ')');
    
    canvas
      .attr('width', boundsBottomRight[0] - boundsTopLeft[0])
      .attr('height', boundsBottomRight[1] - boundsTopLeft[1])
      .style('left', boundsTopLeft[0] + 'px')
      .style('top', boundsTopLeft[1] + 'px');
  };
}

function projectLoad() {
  // uncomment the cdn.rawgit.com versions and comment the cis.umassd.edu versions if you require all https data
  d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/gz_2010_us_040_00_20m.json")
    .defer(d3.json, "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json") // dict with key as abbrev and value as full name
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/listings.csv")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/state_cnt.json")
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/cat_cnt.json")
    .await(createVis);
}

window.onload = projectLoad;
var g1;
var g2;
