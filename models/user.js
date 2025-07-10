const mon=require('mongoose')
const schema=mon.Schema;

const user=new schema({
    email:{ type: String , required:true,unique:true},
    pwd:{type:String, required:true},
    list:{
        type:Object,
        default:{}
    }
})

module.exports=mon.model('User',user);