//function createVis(errors, mapData, spendingData)  {
function createVis(errors, map_data, state_abbrev, listings_data)  {
  var features = map_data.features;
  console.log(features);
  console.log(state_abbrev);
  console.log(listings_data);
}

function assignment3() {
  // uncomment the cdn.rawgit.com versions and comment the cis.umassd.edu versions if you require all https data
  d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/gz_2010_us_040_00_20m.json")
    .defer(d3.json, "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json") // dict with key as abbrev and value as full name
    .defer(d3.csv, "https://raw.githubusercontent.com/salmonroesushi/dsc530/master/data/listings.csv")
    .await(createVis);
}

window.onload = assignment3;
var g_test;
var width = 960,
    height = 500;
