const mongodb_room_post_queries = require("./../../mongodb_queries/room_post")
const {} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{
        
        async create_room_post(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }
            
            const room_post_object = args.user_input
            //TODO: validate the input

            const result = await mongodb_room_post_queries.create_room_post(context.db_structure, room_post_object)
            return result
        },

        async edit_room_post(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //TODO: validate the input
            const room_post_edit_object = args.user_input
            const room_post_id = args._id

            const result = await mongodb_room_post_queries.edit_room_post(context.db_structure, room_post_id, room_post_edit_object)
            return result
        },

        async deactivate_room_post(parents, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //TODO: validate the input
            const room_post_id = args._id

            const result = await mongodb_room_post_queries.deactivate_room_post(context.db_structure, room_post_id)
            return result
        },

    }
}