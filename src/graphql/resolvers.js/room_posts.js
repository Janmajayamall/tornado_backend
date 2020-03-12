const mongodb_room_post_queries = require("./../../mongodb_queries/room_post")
const {create_room_post_validation, validator_wrapper, objectid_validation, edit_room_post_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")
const {db_instance_validation} = require("./../../utils/general_checks")

module.exports = {
    Mutation:{
        
        async create_room_post(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }
            
            const room_post_object = args.user_input

            //validate the input
            validator_wrapper(create_room_post_validation(room_post_object))

            const result = await mongodb_room_post_queries.create_room_post(context.db_structure, room_post_object)
            return result
        },

        async edit_room_post(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //validate the input
            const room_post_edit_object = args.user_input
            const room_post_id = args._id

            validator_wrapper(edit_room_post_validation(room_post_edit_object))
            validator_wrapper(objectid_validation(room_post_id))

            const result = await mongodb_room_post_queries.edit_room_post(context.db_structure, room_post_id, room_post_edit_object)
            return result
        },

        async deactivate_room_post(parents, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            const room_post_id = args._id

            //validate the input
            validator_wrapper(objectid_validation(room_post_id))

            const result = await mongodb_room_post_queries.deactivate_room_post(context.db_structure, room_post_id)
            return result
        },

    },

    Query:{

        async get_room_posts_user_id(parents, args, context){
            //authenticating user request and identifying user_id
            const user_id = await verify_jwt(context.req_headers.authorization)
    
            //validating main_db instance
            db_instance_validation(context.db_structure.main_db)

            //getting room_posts matching user_id
            const result = await mongodb_room_post_queries.get_room_posts_user_id(context.db_structure, user_id, {})
            return result

        }

    }

}