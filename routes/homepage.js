import express from "express";
var router = express.Router();

router.get("/homepage", (req, res, next) => {
    res.send("<div>Many Books<div>")
})

export default router;