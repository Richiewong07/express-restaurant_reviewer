var express = require('express');
var app = express();
var body_parser = require('body-parser');
var pgp = require('pg-promise')({
  promiseLib: Promise
});

var db = pgp({database: 'restaurantv2'});


app.set('view engine', 'hbs');
app.use('/static', express.static('public'));
app.use(body_parser.urlencoded({extended: false}));


app.get('/', function(req, resp) {
  resp.render('search.hbs');
});


app.get('/search', function(req, resp, next) {
  let searchTerm = req.query.searchTerm;
  console.log('Search Term:', searchTerm)
  var query = "SELECT * FROM restaurant WHERE restaurant.name ILIKE '%$1#%'";
  db.any(query, searchTerm)
    .then(function(resultsArray) {
      var context = {
        title: 'Search Results',
        results: resultsArray
      };
      resp.render('search_results.hbs', context);
    })
    .catch(next);
});



app.get('/submit_review', function(req, resp) {
  var id = req.query.id;
  console.log(id);
  resp.render('submit_review.hbs' , {id: id})
});

app.post('/submit_review', function(req, resp, next) {
  var id = req.body.id;
  var stars = req.body.stars;
  var title = req.body.title;
  var review = req.body.review;
  var columns = {
    stars: stars,
    title: title,
    review: review,
    restaurant_id: id
  }
  console.log(id);
  var query = 'INSERT INTO review VALUES\
    (DEFAULT, NULL, ${stars}, ${title}, ${review}, ${restaurant_id}) RETURNING id';
  db.any(query, columns)
    .then(function(results) {
      console.log(results)
      resp.redirect('/restaurant/' + id);
    })
    .catch(next);
});


app.get('/restaurant/new', function(req, resp) {
  resp.render('new.hbs')
});


app.post('/restaurant/submit_new', function(req, resp, next) {
  var name = req.body.name;
  var address = req.body.address;
  var category = req.body.category;
  var query = 'INSERT INTO restaurant VALUES (DEFAULT, ${name}, ${address}, ${category}) RETURNING id';
  db.one(query)
    .then(function(results) {
      console.log("Restaurant ID:", results.id)
      resp.redirect('/restaurant/' + results.id)
    })
  .catch(next);
});



app.get('/restaurant/:id', function(req, resp, next) {
  var id = req.params.id;
  var q = 'SELECT restaurant.id, restaurant.name AS restaurant_name, restaurant.address, restaurant.category, \
  review.stars, review.title, review.review, reviewer.name AS reviewer_name,reviewer.email, reviewer.karma from restaurant \
  LEFT JOIN review ON restaurant.id = review.restaurant_id \
  LEFT JOIN reviewer ON reviewer.id = review.reviewer_id \
  WHERE restaurant.id = $1';
  console.log('My ID is ' +  id);
  db.any(q,id)
    .then(function(results) {
      console.log("Restaurant and Reviews Info", results)
      resp.render('restaurant.hbs', {
        results: results
      })
    })
    .catch(next);
})


app.listen(8000, function () {
  console.log('Listening on port 8000');
});
