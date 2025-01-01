const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//code begins here ......

const mongoose = require('mongoose');
const req = require('express/lib/request')
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI);
app.use(express.urlencoded({extended: true}))

const UserSchema = new Schema({
username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
user_id: {type:String, required: true},
description: String,
duration: Number,
date: Date,
});
const Exercise = mongoose.model("Exercise",ExerciseSchema);

app.post("/api/users", async (req,res)=>{
  const userObj = new User({
    username: req.body.username
  })
  try{
    const user = await userObj.save()
    console.log(user);
    res.json(user)
  }catch(err){
    console.log(err)
  }
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body

  try {
    const user = await User.findById(id)
    if(!user){
      res.send("Could not find user")
    }else{
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch (error) {
    console.log(err);
    res.send("There was an error saving the exercise")
  }
})

app.get('/api/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find(); // This will retrieve all users and their associated data

    // If no users are found, return a message
    if (users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    // Respond with all user data in an array format
    res.json(users);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "An error occurred while fetching users" });
  }
});

app.get("/api/users/:_id/logs", async (req,res)=>{
  const { from, to, limit}= req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.send("Cound not find user")
    return;
  }
  let dateObj = {}
  if (from){
    dateObj["$gte"] = new Date(from)
  }
  if(to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = dateObj;
  }
  const exercises= await Exercise.find(filter).limit(+limit ?? 500)
  const log = exercises.map(e=>({
    description: e.description,
    duration:e.duration,
    date: e.date.toDateString()
  }))
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})

//code ends here.....



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
