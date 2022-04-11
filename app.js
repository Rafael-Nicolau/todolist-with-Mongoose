//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistv2DB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<--- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// Item.insertMany(defaultItems, function(err){
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Default items added");
//   }
// });

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Default items added");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  // List.findOne({name: customListName}, function(err, foundItems){
  //   if(!err) {
  //     console.log(err);
  //   } else if (foundItems.length === 0) {
  //     const list = new List({
  //       name: customListName,
  //       items: defaultItems
  //     });
  //     list.save();
  //     setTimeout(() => {res.redirect("/" + customListName);}, 1000);
  //   } 
  // });

  List.findOne({name: customListName}, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list if doesnt exist
        const list = new List({
          name: customListName,
          items: defaultItems
        }); 
        list.save();
        setTimeout(() => {res.redirect("/" + customListName);}, 1000);
      } else if (foundList.items.length === 0) {
        List.findOneAndUpdate({name: foundList.name}, {$push: {items: defaultItems}}, function(err){
          if (err) {
            console.log(err);
          } else {
            //console.log("Default items added on: " + foundList);
          }
        });
          setTimeout(() => {res.redirect("/" + customListName);}, 1000);
        } else {
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});      
      }
    }
  });

  


});


  // const day = date.getDate();

//   res.render("list", {listTitle: day, newListItems: items});

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post('/delete', function (req, res) {
  
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //now remove item
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } 
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
  
  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});