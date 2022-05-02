// jshint require es6

// 1. the exported value if we tdo
module.exports.getDate = getDate;

function getDate() {
    let day = new Date().toLocaleString(
        'en-US', {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
    return day;
}

// 2. making anonymous function and save to variable

exports.getDay = getDay; // getDay is the function name below

var getDay = function() {
    let day = new Date().toLocaleString(
        'en-US', {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
    return day;
}


// 3. can also use exports.getDay