const express = require("express")
const initialising_mongodb = require("./dbs/mongodb_connection")
const {ApolloServer, gql} = require("apollo-server-express")
const collections = require("./dbs/schema/collections") 
const type_defs = require("./src/graphql/type_defs")
const resolvers = require("./src/graphql/resolvers.js/index")
const db_structure = require("./dbs/db_structure")


//connecting to the database
let mongodb_connections


initialising_mongodb.connect_all_db().then(async database_connections => {

    mongodb_connections = database_connections
    console.log(mongodb_connections)

    //configuring dbs
    db_structure.main_db.db_instance = mongodb_connections.main_connection.db(db_structure.main_db.name)
  
    //setting up collection in main_db
    await collections.create_user_collection(db_structure)
    await collections.create_user_account_collection(db_structure)
    await collections.create_room_collection(db_structure)
    await collections.create_room_follow_collection(db_structure)
    await collections.create_room_post_collection(db_structure)
    await collections.create_likes_collection(db_structure)
    await collections.create_comments_collection(db_structure)
    await collections.create_images_collection(db_structure)
    await collections.create_captions_collection()
    await collections.create_password_recovery_codes_collection()

    //creating indexes TODO: move this to separate file
    await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).createIndex({name:"text"})
    await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.password_recovery_codes).createIndex( { "createdAt": 1 }, { expireAfterSeconds: 600 } )
    
})


// Initialising the app 
const app = express()

//Initialising ApolloServer
const server = new ApolloServer({
    typeDefs:type_defs,
    resolvers:resolvers,
    context:({req})=>{
        return({
            db_structure:db_structure,
            req_headers:req.headers,
            
        })

    }   
})


server.applyMiddleware({app})

//Starting the server
app.listen({port:process.env.PORT || 3000}, function(){
    console.log(`Server started on http://localhost:${process.env.PORT || 3000}${server.graphqlPath}`);
  });


//closing the connection
function close_mongodb_connection(connection){
    if (connection){
        connection.close().then((w)=>{
            console.log("MongoDB Connection Closed")
            return
        })
    }else{
        return
    }
}

//when nodemon restarts 
process.once('SIGUSR2', async function(){
    await Promise.all([close_mongodb_connection(mongodb_connections.main_connection)])
    process.kill(process.pid, 'SIGUSR2');
})

// when app terminates
process.on('SIGINT', async function() {
    await Promise.all([close_mongodb_connection(mongodb_connections.main_connection)])
    process.exit(0);
});