'use strict';

var Alexa = require('alexa-sdk');
var request = require("request");
var APP_ID = '***************************';
var API_KEY = '***********************''';
var goodbyeMessage = 'Enjoy your film!';
var helpMessage = 'Provide me with a genre, actor name or both';
var temp = null;
var tempGenre = null;
var tempGenreId;
var tempId;
var tempFilm;
var alexa;
var pageNumber;

exports.handler = function(event, context, callback) {
  alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var handlers = {
  'LaunchRequest': function() {
    this.emit('recommendMovie');
  },
  'recommendMovie': function() {
    temp = this.event.request.intent.slots.actor.value;
    tempGenre = this.event.request.intent.slots.genre.value;

    if (temp != null && tempGenre == null) {
      getId(temp, function(response) {
        var responseData = JSON.parse(response);
        tempId = responseData.results[0].id;

        getActorsMovies(tempId, function(response) {
          var responseData = JSON.parse(response);
          var maxInt = responseData.cast.length;
          var randomNumber = Math.floor(Math.random() * (maxInt - 0) + 0);
          tempFilm = responseData.cast[randomNumber].title;
          alexa.emit(':tell', tempFilm);
        });
      });
    } else if (temp == null && tempGenre != null) {
      getGenreId(tempGenre, function(response) {
        var responseData = JSON.parse(response);
        for (var i = 1; i < responseData.genres.length; i++) {
          if (responseData.genres[i].name === tempGenre) {
            tempGenreId = responseData.genres[i].id;
          }
        }

        console.log(tempGenreId);
        checkNoPagesInGenre(tempGenreId, function(response) {
          var responseData = JSON.parse(response);
          console.log(pageNumber);
          console.log(responseData.total_pages);
          if(responseData.total_pages >= 1000) {
            pageNumber = 1000;
          } else {
            pageNumber = responseData.total_pages;
          }
          console.log(pageNumber);

          getMovieByGenre(tempGenreId, function(response) {
            console.log(tempGenreId);
            var responseData = JSON.parse(response);
            var randomFilmNumber = Math.floor(Math.random() * (20 - 0) + 0);
            console.log(responseData);
            tempFilm = responseData.results[randomFilmNumber].title;
            alexa.emit(':tell', tempFilm);
          });
        });
      });
    } else if (temp != null && tempGenre != null) {
      getGenreId(tempGenre, function(response) {
        var responseData = JSON.parse(response);
        for (var i = 1; i < responseData.genres.length; i++) {
          if (responseData.genres[i].name === tempGenre) {
            tempGenreId = responseData.genres[i].id;
          }
        }

        getId(temp, function(response) {
          var responseData = JSON.parse(response);
          tempId = responseData.results[0].id;

          actorAndGenreSearch(tempGenreId, tempId, function(response) {
              var responseData = JSON.parse(response);
              var randomFilmNumber = Math.floor(Math.random() * (responseData.results.length - 0) + 0);
              tempFilm = responseData.results[randomFilmNumber].title;
              alexa.emit(':tell', tempFilm);
          });
        });
        });
    } else {
      alexa.emit('AMAZON.StopIntent');
    }
  },
  'AMAZON.HelpIntent': function() {
    output = helpMessage;
    this.emit(':ask', output, output);
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', goodbyeMessage);
  },
  'Unhandled': function() {
    output = HelpMessage;
    this.emit(':ask', helpMessage, helpMessage);
  }
};

function getId(query, callback) {
  var options = {
    method: 'GET',
    url: 'https://api.themoviedb.org/3/search/person',
    qs: {
      include_adult: 'false',
      page: '1',
      query: temp,
      language: 'en-US',
      api_key: API_KEY
    },
    body: '{}'
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    callback(body);
  });
}

function getActorsMovies(query, callback) {
  var url = 'https://api.themoviedb.org/3/person/' + tempId + '/movie_credits';

  var options = {
    method: 'GET',
    url: url,
    qs: {
      language: 'en-US',
      api_key: API_KEY
    },
    body: '{}'
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    callback(body);
  });
}

function getGenreId(query, callback) {
  var options = {
    method: 'GET',
    url: 'https://api.themoviedb.org/3/genre/movie/list',
    qs: {
      language: 'en-US',
      api_key: API_KEY
    },
    body: '{}'
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    callback(body);
  });
}

function checkNoPagesInGenre(query, callback) {
  var url = 'https://api.themoviedb.org/3/genre/' + tempGenreId + '/movies';

var options = {
  method: 'GET',
  url: url,
  qs: {
    sort_by: 'created_at.asc',
    include_adult: 'false',
    language: 'en-US',
    api_key: API_KEY
  },
  body: '{}'
};

request(options, function(error, response, body) {
  if (error) throw new Error(error);
  callback(body);
});
}

function getMovieByGenre(query, callback) {

  var options = { method: 'GET',
    url: 'https://api.themoviedb.org/3/discover/movie',
    qs:
     { with_genres: tempGenreId,
       page: pageNumber,
       include_video: 'false',
       include_adult: 'false',
       sort_by: 'popularity.desc',
       language: 'en-US',
       api_key: API_KEY },
    body: '{}' };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    callback(body);
  });
}

function actorAndGenreSearch(q, p, callback) {

  var options = { method: 'GET',
    url: 'https://api.themoviedb.org/3/discover/movie',
    qs:
     { with_genres: tempGenreId,
       with_cast: tempId,
       include_video: 'false',
       include_adult: 'false',
       sort_by: 'popularity.desc',
       language: 'en-US',
       api_key: API_KEY },
    body: '{}' };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    callback(body);
  });
}
