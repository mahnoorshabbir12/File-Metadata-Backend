import serverless from "serverless-http"; // <-- Required for Vercel
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
// const multer = require('multer');
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(cors());
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/public/views/index.html");
});

// body-parser setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// multer setup

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/temp");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

const isLocal = process.env.NODE_ENV !== "production";

const upload = multer({
  storage: isLocal
    ? multer.diskStorage({
        destination: (req, file, cb) => cb(null, "./public/temp"),
        filename: (req, file, cb) => cb(null, file.originalname),
      })
    : multer.memoryStorage(),
});

// const upload = multer({ storage: multer.memoryStorage() });
// export const upload = multer({ storage: storage });
console.log("Multer setup successful..");

// Connect to MongoDB

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// model

const fileSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});
const File = mongoose.model("File", fileSchema);
console.log("Model created successfully..");

// create file

const createFile = async (req, res) => {
  try {
    // const { url } = File.body.url;
    if(!req.file){
      return res.status(400).json({ error: "Missing file" });
    }
    const { originalname: name, size, mimetype: type } = req.file;
    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }
    if (!size) {
      return res.status(400).json({ error: "Missing size" });
    }
    if (!type) {
      return res.status(400).json({ error: "Missing type" });
    }
    const file = new File({
      name,
      size,
      type,
    });
    if (!file) {
      return res.status(404).json("file creation failed..");
    }
    try {
  await file.save();
  console.log("File saved successfully..");
} catch (error) {
  console.error("Couldn't save the file..", error);
}
    
    // file.uploaded = true;
    res.status(201).json({
      name,
      size,
      type,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "File creation failed..." });
  }
};

app.post("/fileanalyse", upload.single("upfile"), createFile);

const port = process.env.PORT || 3000;
// app.listen(port, function () {
//   console.log("Your app is listening on port " + port);
// });

// Export for Vercel
export default serverless(app);