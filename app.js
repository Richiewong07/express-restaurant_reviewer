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




// app.get('/search', function(request, response, next) {
//   var searchTerm = request.query.searchTerm;
//   console.log('Search Term:', searchTerm)
//   db.any(`
//     SELECT * FROM restaurant
//     WHERE restaurant.category ILIKE '%${searchTerm}%'
//     `)
//     .then(function(results) {
//       console.log('Restaurant Details:', results)
//       response.render('search_results.hbs', {
//         results: results
//     });
//   })
//   .catch(next);
// })

// app.get('/restaurant/:id', function(request, response, next) {
//   var id = request.params.id;
//   db.any(`
//     SELECT
//       restaurant.name AS restaurant_name,
//       restaurant.address,
//       restaurant.category,
//       reviewer.name AS reviewer_name,
//       review.title,
//       review.stars,
//       review.review
//     FROM
//       restaurant
//     LEFT OUTER JOIN
//       review on review.restaurant_id = restaurant.id
//     LEFT OUTER JOIN
//       reviewer on review.reviewer_id = reviewer.id
//     WHERE
//       restaurant.id = ${id}
//     `)
//     .then(function(reviews) {
//       console.log("Reviews Info", reviews)
//       response.render('restaurant.hbs', {
//         restaurant: reviews[0],
//         reviews: reviews
//       })
//     })
//     .catch(next);
// });




// santitize your inputs

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

app.get('/restaurant/new', function(req, resp) {
  resp.render('new.hbs')
});

app.post('/restaurant/submit_new', function(req, resp, next) {
  var name = req.body.name;
  var address = req.body.address;
  var category = req.body.category;
  var query = `INSERT INTO restaurant VALUES (DEFAULT, '${name}', '${address}', '${category}') RETURNING id`;
  db.one(query)
    .then(function(restaurant) {
      resp.redirect('/restaurant/' + restaurant.id)
    })
  .catch(next);
});


app.get('/restaurant/:id', function(req, resp, next) {
  let id = req.params.id;
  var query1 = db.one("\
    SELECT restaurant.name AS restaurant_name, * FROM restaurant \
    WHERE id = $1", id);
  var query2 = db.any("\
    SELECT reviewer.name AS reviewer_name, * FROM review\
    INNER JOIN reviewer ON review.reviewer_id = reviewer.id\
    WHERE review.restaurant_id = $1", id);
  return Promise.all([query1, query2])
    .then(function(reviews) {
      console.log("Reviews Info", reviews)
      resp.render('restaurant.hbs', {
        restaurant: reviews[0],
        reviews: reviews[1]
      })
    })
    .catch(next);
})

app.post('/restaurant/:id', function(req, resp, next) {
  var restaurant_id = req.params.id;
  var name = req.body.name;
  var stars = req.body.stars;
  var title = req.body.title;
  var review = req.body.review;
  var query1 = `INSERT INTO reviewer VALUES (DEFAULT, '${name}')`;
  var query2 = `INSERT INTO review VALUES
    (DEFAULT, NULL, ${stars}, '${title}', '${review}', ${restaurant_id})`;
  db.none(query1, query2)
    .then(function(results) {
      resp.redirect('/restaurant/' + restaurant_id);
    })
    .catch(next);
});



app.listen(8000, function () {
  console.log('Listening on port 8000');
});
