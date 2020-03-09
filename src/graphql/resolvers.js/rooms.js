const mongodb_room_queries = require("./../../mongodb_queries/room")
const {} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{
        async create_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            const room_object = args.user_input

            //TODO:Validate

            let result = await mongodb_room_queries.create_room(context.db_structure, room_object)
            return result
        },

        async deactivate_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //validate the id
            if (!args._id){
                throw new UserInputError("Please provide the room id")
            }

            let result = await mongodb_room_queries.deactivate_room(context.db_structure, args._id)

            
            return result
        },

        async follow_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //TODO: validating the input

            //following the room


        },

        async reactivate_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //validate the id
            if (!args._id){
                throw new UserInputError("Please provide the room id")
            }

            let result = await mongodb_room_queries.reactivate_room(context.db_structure, args._id)
            
            return result
        }



    }
}