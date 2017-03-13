var request = require('request');
var cheerio = require('cheerio');
var csv = require('ya-csv');
var async = require('async');
var _ = require('underscore');
var writer = new csv.createCsvFileWriter("Links.csv");
writer.writeRecord(["RentoMojo result"]);

var mainLink = 'https://medium.com/';
var result = [];

var visitedLinks = [];
var pageLimit = 2; //To limit the number of pages covered, else it will take a long time to complete
var currentPage = 1;

request(mainLink, function (err, res, data) {
    var $ = cheerio.load(data);
    var anchorTagsArray = $('a');
    var anchorTags = [];

    [].forEach.call(anchorTagsArray, function (url) {
        anchorTags.push(url.attribs.href);
    });

    var filteredTags = filterDuplicateTags(anchorTags);
    filteredTags.splice(filteredTags.indexOf(mainLink, 1));
    result.push(mainLink);
    visitedLinks.push(mainLink);

    var q = async.queue(function (urlValue, callback) {
        if (visitedLinks.indexOf(urlValue) == -1) {

            visitedLinks.push(urlValue);
            result.push(urlValue);

            request(urlValue, function (err, res, data) {
                if (data) {
                    var $ = cheerio.load(data);
                    var anchorTagsArray = $('a');
                    var anchorTags = [];
                    [].forEach.call(anchorTagsArray, function (url) {
                        anchorTags.push(url.attribs.href);
                    });
                    var filteredTags = filterDuplicateTags(anchorTags);
                    filteredTags.splice(filteredTags.indexOf(urlValue, 1));
                    [].push.apply(result, filteredTags);
                }
                callback();
            });
        }
        else {
            callback();
        }
    }, 5);

    function pushToQ(filteredTags) {
        for (var i = 0; i < filteredTags.length; i++) {
            q.push(filteredTags[i]);
        }
    }
    pushToQ(filteredTags);
    currentPage++;

    q.drain = function () {
        if (currentPage < pageLimit) {
            currentPage++;
            pushToQ(result);
        }
        else
            writeFunction(result);
    };
});

function filterDuplicateTags (tags) {
    return  tags.filter(function (tagUrl) {
        return tags.indexOf(tagUrl) === tags.lastIndexOf(tagUrl);
    });
}

function writeFunction (result) {
    var results = result.filter(function (url) {
        return result.indexOf(url) === result.lastIndexOf(url);
    });
    _.each(results,
      function(res){
        writer.writeRecord([res]);
      }
    );
}

