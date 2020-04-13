const MongoClient = require('mongodb').MongoClient
const Logger = require('mongodb').Logger
const bugsnap_client = require("./../bugsnag/bugsnag")


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
        // connecting to Mongodb server uri
        let MONGO_URL = process.env.MONGODB_URL

        if(MONGO_URL===undefined){
            throw new Error("MONGO_URL not defined; process.env not set")
        }

        let database_list = await Promise.all([connect(MONGO_URL)])
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