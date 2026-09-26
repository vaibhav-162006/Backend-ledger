const { Router } = require('express')
const transictionRoutes = Router();
const authMiddleware = require("../middleware/auth.middleware")
const transictionController= require("../controller/transiction.controller")


/**
 * Transiction
 */
transictionRoutes.post("/" ,authMiddleware.middlewareReq , transictionController.createTransiction)
transictionRoutes.post("/system/initial-funds" , authMiddleware.authsystemUserMiddleware , transictionController.IntailFunds)
transictionRoutes.post("/system/intital-funds" , authMiddleware.authsystemUserMiddleware , transictionController.IntailFunds)
module.exports = transictionRoutes;
