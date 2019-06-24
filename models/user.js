const mongoose=require("mongoose");

const userSchema = mongoose.Schema({
    username:String,
    password:String
});

userSchema.plugin(passmongo);

const user = mongoose.model("user",userSchema);