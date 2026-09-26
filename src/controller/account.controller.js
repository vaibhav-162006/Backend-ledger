const accountModel = require("../models/account.model")
 async function createAccountController(req,res){
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;
    const account = await accountModel.create({
        user: user._id
    })
    res.status(201).json({
        account
    })
 }
 async function getUserAccountsController(req,res){
    const account = await accountModel.find({user: req.user._id});

    res.status(200).json({
        account
    })
 }
 async function getAccountBalanaceController(req,res){
     const { accountId } = req.params
     if (!require("mongoose").isValidObjectId(accountId)) {
        return res.status(400).json({ message: "Invalid accountId" });
     }
     const  account = await accountModel.findOne({
        _id:accountId,
        user: req.user._id
     }) 
     if(!account){
        return res.status(404).json({
            message:"Account not found"
        })
     }
     const balance = await account.getBalance()
     res.status(200).json({
        accountId: account._id,
        balance: balance 
     })
 }
 module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanaceController
 }
