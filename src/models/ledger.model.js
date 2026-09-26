const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({
    account:{
        type : mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true , "Ledger must be associated with an account"],
        index: true,
        immutable:true
    },
    amount:{
        type:Number,
        required: [true , "ammount is required for ledger"],
        immutable: true
    },
    transiction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transiction",
        required: [true , "Ledger must be associated with transiction "],
        index: true,
        immutable:true
    },
    type:{
        type: String ,
        enum:{
            values: ["CREDIT" , "DEBIT"],
            message: "Type can be either CREDITED or DEBIT"
        },
        required:[true , "Ledger type is required"],
        immutable:true
    }
})
function preventLedgerModification (){
    throw new Error("Ledger entries are muttable and cannot be modified")
}
ledgerSchema.pre('findOneAndUpdate' ,preventLedgerModification);
ledgerSchema.pre('updateOne' , preventLedgerModification);
ledgerSchema.pre('deleteOne' , preventLedgerModification);
ledgerSchema.pre('remove' ,preventLedgerModification);
ledgerSchema.pre('deleteMany' ,preventLedgerModification);
ledgerSchema.pre('updateMany' ,preventLedgerModification);
ledgerSchema.pre('findOneAndDelete' ,preventLedgerModification);
ledgerSchema.pre('findOneAndReplace' ,preventLedgerModification);

const ledgerModel = mongoose.model('ledger' , ledgerSchema)
module.exports = ledgerModel; 
