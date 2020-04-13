const MongoClient = require('mongodb').MongoClient
const Logger = require('mongodb').Logger
const bugsnap_client = require("./../bugsnag/bugsnag")


// connecting to Mongodb server
const DEV_URI = process.env.MONGODB_DEV_URL

// connecting to the database
function connect(url){
    return MongoClient.connect(url, {useUnifiedTopology:true}).then(client=>{
        Logger.setLevel("debug")
        Logger.setLevel("error")
        Logger.setLevel("info")
        Logger.setCurrentLogger(function(msg, context){
            console.log(msg, context, "MongDb Logger")
        })
        return client
    })
}

async function connect_all_db(){
    try{
        let database_list = await Promise.all([connect(DEV_URI)])
        return{
            main_connection:database_list[0]
        }
    }catch(e){
        bugsnap_client.notify("not connected to db")
        console.error(e, "Unable to connect to the database");
        process.exit();
    }
}

module.exports={
    connect_all_db:connect_all_db
}