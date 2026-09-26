const express = require("express")
const middlewareReq = require("../middleware/auth.middleware")
const accountController = require("../controller/account.controller")
const router = express.Router();
/**]
 * Post/api/accounts
 * -Create a new account
 * 
 */
router.post("/" , middlewareReq.middlewareReq ,accountController.createAccountController)
router.get("/" , middlewareReq.middlewareReq , accountController.getUserAccountsController)
/**
 * Get /api/accounts/balance/:accountId
 */

router.get("/balance/:accountId" ,middlewareReq.middlewareReq,accountController.getAccountBalanaceController)
module.exports = router;