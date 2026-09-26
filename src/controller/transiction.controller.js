const transictionModel = require("../models/transiction.models")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")
/**
 * -Create a new transiction 
 * the 10 step transfer flow:
        * 1. validet request
        * 2. validate idempotentkey
        * 3. check account status 
        * 4. derive sender balance from ledger
        * 5. Create a transiction (pending)
        * 6. Create a debit ledger entry
        * 7. create a credit ledger entry 
        * 8. mark transiction complete
        * 9. commit mongodb selection
        * 10. send email notification  
        *  
 */


async function createTransiction(req,res){
       const { fromAccount, toAccount, idempotencyKey } = req.body;
       const amount = Number(req.body.amount);
       if (!fromAccount || !toAccount || !idempotencyKey || !Number.isFinite(amount) || amount <= 0) {
              return res.status(400).json({ message: "fromAccount, toAccount, a positive amount and idempotencyKey are required" });
       }
       if (!mongoose.isValidObjectId(fromAccount) || !mongoose.isValidObjectId(toAccount)) {
              return res.status(400).json({ message: "Invalid fromAccount or toAccount" });
       }
       if (fromAccount === toAccount) return res.status(400).json({ message: "fromAccount and toAccount must be different" });

       const existing = await transictionModel.findOne({ idempotencyKey });
       if (existing) {
              if (String(existing.fromAccount) !== fromAccount || String(existing.toAccount) !== toAccount || existing.amount !== amount) {
                     return res.status(409).json({ message: "idempotencyKey was already used for a different transaction" });
              }
              return res.status(existing.status === "COMPLETED" ? 200 : 409).json({ message: "Transaction already exists", transiction: existing });
       }

       const [sender, recipient] = await Promise.all([
              accountModel.findOne({ _id: fromAccount, user: req.user._id }),
              accountModel.findById(toAccount)
       ]);
       if (!sender || !recipient) return res.status(404).json({ message: "Sender or recipient account not found" });
       if (sender.status !== "ACTIVE" || recipient.status !== "ACTIVE") {
              return res.status(403).json({ message: "Both accounts must be ACTIVE to process a transaction" });
       }
       const balance = await sender.getBalance();
       if (balance < amount) return res.status(400).json({ message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}` });

       const session = await mongoose.startSession();
       let transiction;
       try {
              session.startTransaction();
              transiction = new transictionModel({ fromAccount, toAccount, amount, idempotencyKey, status: "PENDING" });
              await transiction.save({ session });
              await ledgerModel.create([
                     { account: fromAccount, amount, transiction: transiction._id, type: "DEBIT" },
                     { account: toAccount, amount, transiction: transiction._id, type: "CREDIT" }
              ], { session, ordered: true });
              transiction.status = "COMPLETED";
              await transiction.save({ session });
              await session.commitTransaction();
       } catch (error) {
              if (session.inTransaction()) await session.abortTransaction();
              throw error;
       } finally {
              await session.endSession();
       }
       try {
              await emailService.sendTransictionEmail(req.user.email, req.user.name, amount, toAccount);
       } catch (error) {
              console.error("Transaction committed but notification failed:", error.message);
       }
       return res.status(201).json({ message: "Transaction completed", transiction, balance: await sender.getBalance() });
}
async function IntailFunds(req,res){
       const {toAccount , amount , idempotencyKey} = req.body;
       if(!toAccount || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !idempotencyKey){
              return res.status(400).json({
              message: "toAccount, a positive amount and idempotencyKey are required"
              })
       }
       if (!mongoose.isValidObjectId(toAccount)) return res.status(400).json({ message: "Invalid toAccount" });
       const recieveuserAccount = await accountModel.findOne({ _id: toAccount });
       if(!recieveuserAccount) return res.status(404).json({ message: "Invalid toAccount" });
       const existingTransiction = await transictionModel.findOne({ idempotencyKey });
       if(existingTransiction){
              if (String(existingTransiction.toAccount) !== toAccount || existingTransiction.amount !== Number(amount)) {
                     return res.status(409).json({ message: "idempotencyKey was already used for a different transaction" });
              }
              return res.status(200).json({
                     message: "Initial funds were already processed",
                     transiction: existingTransiction,
                     balance: await recieveuserAccount.getBalance()
              });
       }
       if (recieveuserAccount.status !== "ACTIVE") return res.status(403).json({ message: "toAccount must be ACTIVE to receive funds" });
       const session = await mongoose.startSession();
       let transiction;
       try {
              session.startTransaction();
              transiction = new transictionModel({ toAccount, amount: Number(amount), idempotencyKey, status: "PENDING" });
              await transiction.save({ session });
              await ledgerModel.create([{ account: toAccount, amount: Number(amount), transiction: transiction._id, type: "CREDIT" }], { session });
              transiction.status = "COMPLETED";
              await transiction.save({ session });
              await session.commitTransaction();
       } catch (error) {
              if (session.inTransaction()) await session.abortTransaction();
              throw error;
       } finally {
              await session.endSession();
       }

       return res.status(201).json({
              message:"Initial funds are completed",
              transiction,
              balance: await recieveuserAccount.getBalance()
       })
}
module.exports= {
       createTransiction,
       IntailFunds
}
