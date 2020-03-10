const mongodb_room_queries = require("./../../mongodb_queries/room")
const {validator_wrapper, 
        create_room_validation, 
        follow_room_validation, 
        unfollow_room_validation,
        objectid_validation
        } = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{
        async create_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            const room_object = args.user_input

            //Validate create_room input
            validator_wrapper(create_room_validation(room_object))

            let result = await mongodb_room_queries.create_room(context.db_structure, room_object)
            return result
        },

        async deactivate_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //validate the id
            validator_wrapper(objectid_validation(args._id))

            let result = await mongodb_room_queries.deactivate_room(context.db_structure, args._id)

            
            return result
        },

        async follow_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            const follow_room_object = args.user_input

            //validating the input
            validator_wrapper(follow_room_validation(follow_room_object))

            //following the room
            const result = mongodb_room_queries.follow_room(context.db_structure, follow_room_object)
            return result
        },

        async unfollow_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            const unfollow_room_object = args.user_input

            //validating the input 
            validator_wrapper(unfollow_room_validation(unfollow_room_object))

            //following the room
            const result = await mongodb_room_queries.unfollow_room(context.db_structure, unfollow_room_object)
            return result
        },

        async reactivate_room(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //validate the id
            validator_wrapper(objectid_validation(args._id))

            let result = await mongodb_room_queries.reactivate_room(context.db_structure, args._id)
            
            return result
        }



    }
}