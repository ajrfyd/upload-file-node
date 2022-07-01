const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File");
const User = require("./models/User");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  dest: "uploads",
});

mongoose.connect(process.env.DATABASE_URL, (e) => {
  if (e) console.log(e);
  else console.log("Connected!");
});

// const test = async () => {
//   const user = new User({ name: 'ajrfyd', age: 33 });
//   await user.save();
//   console.log(user);
// };
// test();

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  console.log(req.body);
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  };

  if (req.body.password !== null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }

  const file = await File.create(fileData);
  console.log(file);
  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

app.route('file/:id').get(handleDownload).post(handleDownload);
// app.get("/file/:id", handleDownload);
// app.post("/file/:id", handleDownload);

app.listen(process.env.PORT, (req, res) => {
  console.log("Welcome!!");
});



async function handleDownload (req, res) {
  const file = await File.findById(req.params.id);

  if (file.password !== null) {
    console.log(req.body.password);
    if (req.body.password === null || req.body.password === '' || req.body.password === undefined) {
      res.render("password");
      return;
    }
    if(!await bcrypt.compare(req.body.password, file.password)) {
      res.render('password', { error: true });
      return;
    };
  }

  file.downloadCount++;
  await file.save();
  res.download(file.path, file.originalName);
}