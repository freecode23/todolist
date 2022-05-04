// @ts-nocheck
// jshint require es6
// On terminal:
// --> 1 npm init
// --> 2 npm install express
// --> 3 npm install body-parser
// --> 4 npm i mongoose

// 1. imports
// - external
const express = require("express");

// to have access to the data in the form that was posted to us (we are the server)
const bodyParser = require("body-parser");

// to use persist database
const mongoose = require('mongoose');

const _ = require('lodash');
// - local 
// to make https get request
const https = require('https');
const date = require(__dirname + "/date.js");

// 2. use 
const app = express();
app.use(express.static("public")) // tell node where our static files are
app.use(bodyParser.urlencoded({ extended: true })); // to get access to the body of our form

// to access css and images
app.set("view engine", "ejs");

const toDoDefault = [];


// 3. set up database
// - specify the port where we can access our mongodb database server
const mongourl = "mongodb+srv://admin-sherly:test123@cluster0.sfxwq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/todolistDB"
mongoose.connect(mongourl);

//- create interface / schema
const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "cannot add an item without name"],
    },
})

// - create item class / model. This is a collection
const Task = mongoose.model("task", taskSchema);

// - create task object
const task1 = new Task({
    name: "my task 1"

})

const task2 = new Task({
    name: "my task 2"
})

const task3 = new Task({
    name: "my task 3"
})

// - create a schema/interface that has an array of task interface
const taskListSchema = {
    name: String,
    tasks: [taskSchema]
}
const TaskList = mongoose.model("TaskList", taskListSchema);

toDoDefault.push(task1);
toDoDefault.push(task2);
toDoDefault.push(task3);

// - insert item to our toDoDefault array


// 4. Define what happen when there are post or get request to routes
// - get "/"
app.get("/", function(reqFromClient, resToClient) {
    console.log("\n>>>>>>>>>>>>>>>> app.get/");
    // get all the tasks from the database Task
    Task.find({}, function(err, foundItems) {

        // if it's 0, insert default
        if (foundItems.length === 0) {
            Task.insertMany(toDoDefault, function(err) {
                if (err) {
                    console.log("insertMany error" + err);
                } else {
                    console.log("Successfuly inserted arrays to tasks collections");
                }
            });

            resToClient.redirect("/");
        } else {

            // show all of the found on "/" route
            resToClient.render("list", {
                titleKey: "Today", // from the date module
                toDoKeys: foundItems // toDoKeys will be passed on to list.
            });

        }

    });
});

// - get dynamic route
app.get("/:categoryName", function(reqFromClient, resToClient) {
    const categoryName = _.capitalize(reqFromClient.params.categoryName);

    console.log("\n>>>>>>>>>>>>>>>> app.get/" + categoryName);


    TaskList.find({ name: categoryName }, function(err, foundLists) {
        // foundList is not an array. its just one document
        if (!err) {
            if (foundLists.length === 0) {
                console.log("no found list. lets make default");

                // create and save
                const list = new TaskList({
                    name: categoryName,
                    tasks: toDoDefault
                });
                list.save();

                // redirect here
                resToClient.redirect("/" + categoryName);

            } else {
                console.log("list exists. lets get updated");
                console.log(foundLists[0]);
                // show it on ejs
                resToClient.render("list", {
                    titleKey: foundLists[0].name,
                    toDoKeys: foundLists[0].tasks
                });
            }
        }
    });
});

// - get to /about
app.get("/about", function(reqFromClient, resToClient) {
    resToClient.render("about");
});


// - post to /
app.post("/", function(reqFromClient, resToClient) {
    // - grab the info from the form
    const addedItem = reqFromClient.body.inputItem;
    const titleName = reqFromClient.body.titleName; // will get us titleKey

    // create new
    const newTask = new Task({
        name: addedItem
    })

    if (titleName === "Today") { // if its a homepage
        console.log("\n>>>>>>>>>>>>>> app.post/");
        newTask.save(); // save it to our home task
        resToClient.redirect("/");

    } else { // custom task
        console.log("\n>>>>>>>>>>>>>> app.post/" + titleName);

        // get that custom list from database using the name
        TaskList.findOne({ name: titleName }, function(err, foundList) {

            // add this newTask to that list
            foundList.tasks.push(newTask);
            foundList.save();
            console.log("After posting: our list is updated:")
            console.log(foundList);
            console.log("Let's make get request\n")
                // show this new task
            resToClient.redirect("/" + titleName);
        });
    }
});

// - post to /delete
app.post("/delete", function(reqFromClient, resToClient) {
    // - grab the info from the form
    // delete checkbox is the name of the input
    // we are taking the value of it
    // if we don't specify the value, it will just say on
    const deleteItemId = reqFromClient.body.deleteCheckbox;
    const deleteListName = reqFromClient.body.titleName;


    if (deleteListName == "Today") {
        console.log("\n>>>>>>>>>>>>>> app.post/ delete");
        console.log("item id to be deleted: " + deleteItemId);

        Task.findByIdAndRemove(deleteItemId, function(err) {
            if (!err) {
                console.log("successfuly deleted item");
                resToClient.redirect("/");
            }
        });
    } else {
        console.log("\n>>>>>>>>>>>>>> app.post/ delete" + deleteListName);
        console.log("item id to be deleted: " + deleteItemId);

        // remove the item from an array
        TaskList.findOneAndUpdate(
            // - conditions
            { name: deleteListName },

            // - updates

            {
                $pull: { // pull from the tasks array, this item with the id
                    tasks: { _id: deleteItemId }
                }
            },

            // - callback
            // if it's a post just redirect
            function(err, foundList) {
                if (!err) {

                    resToClient.redirect("/" + deleteListName);
                }
            });
    }

});


// 5. listen
// allow heroku to choose port
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});