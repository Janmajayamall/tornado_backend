const mongodb_room_post_queries = require("./../../mongodb_queries/room_post")
const {create_room_post_validation, validator_wrapper, objectid_validation, edit_room_post_validation, get_room_post_object_validation, get_user_profile_posts_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")
const {db_instance_validation} = require("./../../utils/general_checks")

module.exports = {
    Mutation:{
        
        async create_room_post(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
            
            const room_post_object = args.user_input
            console.log(room_post_object)
            //validate the input
            validator_wrapper(create_room_post_validation(room_post_object))

            const result = await mongodb_room_post_queries.create_room_post(context.db_structure, room_post_object)
            return result
        },

        async edit_room_post(parent, args, context){
            //TODO: change the edit room post. Limit it to updating the room ids, description, and links -- you can leave editing the image for now 
            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //validate the input
            const room_post_edit_object = args.user_input
            const room_post_id = args._id
            validator_wrapper(edit_room_post_validation(room_post_edit_object))
            validator_wrapper(objectid_validation(room_post_id))

            const result = await mongodb_room_post_queries.edit_room_post(context.db_structure, room_post_id, room_post_edit_object)
            return result
        },

        async deactivate_room_post(parents, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

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

            const get_room_post_object = args.user_input

            //validating get_room_post_object
            validator_wrapper(get_room_post_object_validation(get_room_post_object))

            //getting room_posts matching user_id
            const result = await mongodb_room_post_queries.get_room_posts_user_id(context.db_structure, user_id, get_room_post_object)
            return result

        },

        async get_room_posts_room_id(parents, args, context){

            //authenticating user request and identifying user_id
            const user_id = await verify_jwt(context.req_headers.authorization)

            //validating main_db instance
            db_instance_validation(context.db_structure.main_db)

            const get_room_post_object = args.user_input
            //validating the input 
            validator_wrapper(get_room_post_object_validation(get_room_post_object))

            //getting the result
            const result = await mongodb_room_post_queries.get_room_posts_room_id(context.db_structure, user_id, get_room_post_object)
            return result            
        },

        async get_user_profile_posts(parents, args, context){

            //authenticating user request and identifying user_id
            const current_user_id = await verify_jwt(context.req_headers.authorization)

            //validating main_db instance
            db_instance_validation(context.db_structure.main_db)

            let get_user_profile_posts_object = args.user_input
            //checking whether user_id is present or not, if not then populating it with current_user_id
            if(!get_user_profile_posts_object.user_id){
                get_user_profile_posts_object.user_id=current_user_id
            }
            //validating the input 
            validator_wrapper(get_user_profile_posts_validation(get_user_profile_posts_object))

            //getting the result
            const result = await mongodb_room_post_queries.get_user_profile_posts(context.db_structure, get_user_profile_posts_object)
            return result            
        }

    
    }

}