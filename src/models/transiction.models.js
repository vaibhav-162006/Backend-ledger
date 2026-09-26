const mongoose = require("mongoose")

const transictionSchema = new mongoose.Schema({
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account" ,
        required: false,
        index: true

    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "account" ,
        required: [true , "Transiction must be associated with a reciever account"],
        index: true
    },
    status:{
        type:String,
        enum:{
            values: ["PENDING" , "COMPLETED", "FAILED" ,"REVERSED"],
            message: "Status can be PENDING, COMPLETED, FAILED or REVERSED"
        },
        default: "PENDING"
    },
    amount:{
        type:Number,
        required:[true , "Amount is required for creating transiction"],
        min:[0 , "Transiction amount cannot be negative"]
    },
    idempotencyKey:{
        type:String,
        required:[true ,"idempotency key is required"],
        unique:true
    }
},{
    timestamps: true
})
const transictionModel = mongoose.model("transiction" , transictionSchema)
module.exports = transictionModel
