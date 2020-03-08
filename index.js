const express = require("express")
const initialising_mongodb = require("./dbs/mongodb_connection")
const {ApolloServer, gql} = require("apollo-server-express")
const collections = require("./dbs/schema/collections") 
const type_defs = require("./src/graphql/type_defs")
const resolvers = require("./src/graphql/resolvers.js/index")


//connecting to the database
let mongodb_connections
let dbs = {
    main_db:null
}

initialising_mongodb.connect_all_db().then(async database_connections => {
    mongodb_connections = database_connections
    console.log(mongodb_connections)

    //configuring dbs
    dbs.main_db = mongodb_connections.main_connection.db("dev1")
  
    
    //setting up collection in main_db
    await collections.create_user_collection(dbs.main_db)
    await collections.create_user_account_collection(dbs.main_db)
    await collections.create_room_collection(dbs.main_db)
    await collections.create_room_follow_collection(dbs.main_db)
    await collections.create_post_collection(dbs.main_db)
    await collections.create_likes_collection(dbs.main_db)
    await collections.create_comments_collection(dbs.main_db)
    
})



// Initialising the app 
const app = express()


//Initialising ApolloServer
const server = new ApolloServer({
    typeDefs:type_defs,
    resolvers:resolvers,
    context:()=>({dbs:dbs})
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