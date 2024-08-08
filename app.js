const express = require("express");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog_posts",
    format: async (req, file) => "png", // supports promises as well
    public_id: (req, file) => file.filename,
  },
});

const upload = multer({ storage: storage });

// CRUD Endpoints

// Create a new blog post with an image
app.post("/posts", upload.single("image"), async (req, res) => {
  const { title, content, description } = req.body;
  const imageUrl = req.file.path; // Cloudinary URL

  const { data, error } = await supabase
    .from("posts")
    .insert([{ title, content, description, image_url: imageUrl }]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(req.body);
});

// Read all blog posts
app.get("/posts", async (req, res) => {
  const { data, error } = await supabase.from("posts").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
});

// Read a single blog post
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.status(200).json(data);
});

// Delete a blog post
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
