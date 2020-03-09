const mongodb_room_queries = require("./../../mongodb_queries/like")
const {} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{

        async create_like(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }
        
            const like_object = args.user_input
            //TODO:Validate the input



        },

        async unlike_content(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }
        
            const like_object = args.user_input
            //TODO:Validate the input
            

    
        },

    }
}