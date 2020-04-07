const mongodb_caption_queries = require("./../../mongodb_queries/caption")
const {create_like_validation, unlike_content_validation, validator_wrapper, objectid_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")
const {db_instance_validation} = require("./../../utils/general_checks")

module.exports = {
    Mutation:{

        async create_caption(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
        
            //extracting caption_input TODO: validate caption_input
            const caption_input = args.user_input

            const result = await mongodb_caption_queries.create_caption(context.db_structure, user_id,caption_input)
            return result
        },

        async delete_caption(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting caption_id
            const caption_id = args.caption_id
            //validating caption_id
            validator_wrapper(objectid_validation(caption_id))

            const result_id = await mongodb_caption_queries.delete_caption(context.db_structure, user_id, caption_id)
            return result_id
        }
    },

    Query:{

        async get_post_captions(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
        
            //extracting post_id
            const post_id = args.post_id
            //validating post_id 
            validator_wrapper(objectid_validation(post_id))

            const result = await mongodb_caption_queries.get_post_captions(context.db_structure, user_id, post_id)
            return result            
        }
    }
}