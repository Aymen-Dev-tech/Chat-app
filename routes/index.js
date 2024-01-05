import express from "express";

const router = express.Router();
const style = `
<link rel="stylesheet" href="css/landing.css" />
`;
router.get("/", (req, res) => {
  res.render("landing", { username: req.user && req.user.name, style: style });
});

export default router;
