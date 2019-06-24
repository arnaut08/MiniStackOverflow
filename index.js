const express=require("express"),
app=express(),
parser=require("body-parser"),
override=require("method-override"),
sanitize=require("express-sanitizer"),
passport=require("passport"),
local=require("passport-local"),
passmongo=require("passport-local-mongoose"),
mongoose=require("mongoose");

app.set("view engine","ejs");
app.use(parser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(override("_method"));
app.use(sanitize());
mongoose.connect("mongodb://localhost/task");

const userSchema = mongoose.Schema({
    username:String,
    password:String
});

userSchema.plugin(passmongo);

const user = mongoose.model("user",userSchema);

app.use(require("express-session")({
    secret:"random",
    resave: false,
    saveUninitialized: false  
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new local(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

const ansSchema = mongoose.Schema({
    by:String,
    content:String,
    datetime:{type:Date, default:Date.now}
});

const answer= mongoose.model("answer",ansSchema);

const queSchema = mongoose.Schema({
    by:String,
    title:String,
    content:String,
    answers:[ansSchema]    
});

const question=mongoose.model("question",queSchema);

auth=(req,res,next)=>{
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/signin")
}

app.get("/signup",(req,res)=>{
    res.render("signup")
});

app.get("/signin",(req,res)=>{
    res.render("signin")
});

app.post("/signup",(req,res)=>{
    req.body.username
    req.body.password
    user.register(user({username:req.body.username}),req.body.password, (error,user)=>{
        if(error){
            console.log(error);
            res.render("signup");
        }
        passport.authenticate("local")(req,res,()=>{
            res.redirect("/signin")
        });
    });
});

app.post("/signin",passport.authenticate("local",{
    successRedirect:"/home",
    failureRedirect:"/signin"
}),(req,res)=>{});

app.get("/logout",(req,res)=>{
    req.logOut();
    res.redirect("/");
});

app.get("/home",auth,(req,res)=>{
    question.find({},(error,ques)=>{
        res.render("dashboard",{ques:ques, user:req.user})
    });
});

app.get("/",(req,res)=>{
    res.redirect("/signin")
});

app.get("/home/add",auth,(req,res)=>{
    question.find({},(error,ques)=>{
        res.render("newQues",{ques:ques,user:req.user.username})
    });
});

app.get("/home/answers",auth,(req,res)=>{
    question.find({},(error,ques)=>{
        res.render("myanswers",{ques:ques,user:req.user.username})
    });
});

app.get("/home/questions",auth,(req,res)=>{
    question.find({},(error,ques)=>{
        console.log(ques);
        res.render("myQuestions",{ques:ques,user:req.user.username})
    });
});

app.post("/home",(req,res)=>{
    req.body.form.content=req.sanitize(req.body.form.content);
    question.create(req.body.form,(error,value)=>{
        if(error){
           console.log("Error")
        } else{
            res.redirect("/home")
        }
    });
});

app.get("/home/questions/:id",auth,(req,res)=>{
    question.findById(req.params.id,(error,ques)=>{
        if(error){
            console.log("error")
        }else{
            res.render("answer",{ques:ques,user:req.user})            
        }
    });
});

app.post("/home/questions/:id",(req,res)=>{
    req.body.form.content=req.sanitize(req.body.form.content);
    answer.create(req.body.form,(error,value)=>{
        question.findOne({_id:req.params.id},(error,foundUser)=>{
            if(error){
                console.log("Error")
            }else{
                foundUser.answers.push(value)
                foundUser.save((error,val)=>{
                    if(error){
                        console.log("error")
                    }else{
                        res.redirect("/home/questions/"+req.params.id)
                    }
                });
             }
        });
    });
});

app.listen(3000,()=>{
    console.log("Connected")
});