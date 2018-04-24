// class to stuff all the data in
// thought this would be better than making everything global to let dropdowns access data and such

var MyVis = function(topo_json, state_id, listings_data) {
  this.topo_json = topo_json;
  this.state_id = state_id;
  this.listings_data = listings_data;
  this.features = null;
  this.categories = null;
  
  // just so I don't need separate calls
  this.initialize = function() {
    this.generateFeatures();
    this.generateCategories();
  }
  
  // generate features from topo_json and add data
  this.generateFeatures = function() {
    var state_id_invert = _invertStateId(this.state_id);
    
    this.features = topojson.feature(topo_json, topo_json.objects.states).features;
    this.features.forEach(function(x) {
      x.state_ab = state_id_invert[x.id].state_ab;
      x.state_name = state_id_invert[x.id].state_name;
      x.job_detail = [];
    });
    
    logger.dev('FEATURES');
    logger.dev(this.features);
    
    _addJobDetails(this.features, this.listings_data);
  };
  
  // generate categories from listings_data
  this.generateCategories = function() {
    var tmp_set = new Set();
    this.listings_data.forEach(function(listing) {
      var cats = listing.category_info.split(',').map(x => (x === '' ? 'empty' : x));
      cats.forEach(x => tmp_set.add(x));
    });
    
    this.categories = Array.from(tmp_set);
  }
  
  /*
    Private Functions
  */
  // take state data array and turn into obj with ID as key
  var _invertStateId = function(state_id) {
    var invert = {};
    state_id.forEach(function(x) {
      invert[x.STATE] = {
        state_ab: x.STUSAB,
        state_name: x.STATE_NAME
      };
    });
    
    return invert;
  };
  
  // add each job w/ categories and lemmas to respective state
  var _addJobDetails = function(feats, listings) {
    logger.dev('ATTEMPT LEMMATIZE FIRST JOB (addJobDetails)');
    logger.dev(listings[0].job_description);
    logger.dev(_getLemmasFromDesc(listings[0].job_description));
    
    listings.forEach(function(listing) {
      // replace empty string category with text empty for later filtering
      var cats = listing.category_info.split(',').map(x => (x === '' ? 'empty' : x));
      
      var feat = _getFeatByAbbreviation(feats, listing.state);
      feat.job_detail.push({
        'categories': cats,
        'lemmas': _getLemmasFromDesc(listing.job_description)
      });
    });
  };
  
  // get a feature by its state abbreviation
  var _getFeatByAbbreviation = function(feats, abbr) {
    var index = feats.findIndex(x => x.state_ab === abbr);
    if(index < 0) {
      logger.error('State abbreviation "' + abbr + '" not found in Feature array');
    }
    
    return feats[index];
  };
  
  // get lemmas from job description
  var _getLemmasFromDesc = function(desc) {
    var desc_plain = getPlainText(desc);
    var desc_arr = removeStopwords(desc_plain.split(' '));
    
    // use set so don't need to remove dupes myself
    var lemma_set = new Set();
    desc_arr.forEach(function(x) {
      lemmatizer.only_lemmas(x).forEach(x => lemma_set.add(x));
    });
    
    return Array.from(lemma_set);
  };
};
