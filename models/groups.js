const mon=require('mongoose')
const schema=mon.Schema;

const group=new schema({
    title:{type:String , required:true},
    pass:{type:String, required:true},
    list:{
        type :Object,
        default:{}
    },
     expense: {
        type: Object,
        of: {
            type: Object,
            of: Number,
            default:{}
        },
        default: {} 
    },
    transactions: [{
  from: String,
  to: String,
  amount: Number,
  time: { type: Date, default: Date.now }
}]

})

module.exports=mon.model('Group',group);