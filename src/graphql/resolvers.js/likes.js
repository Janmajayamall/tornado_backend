const mongodb_like_queries = require("./../../mongodb_queries/like")
const {create_like_validation, unlike_content_validation, validator_wrapper, objectid_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")
const {db_instance_validation} = require("./../../utils/general_checks")

module.exports = {
    Mutation:{

        async create_like(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
        
            const like_object = args.user_input
            
            //Validate the input
            validator_wrapper(create_like_validation(like_object))

            const result = await mongodb_like_queries.create_like(context.db_structure, like_object)
            return result
        },

        async unlike_content(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
        
            const like_object = args.user_input
            
            //Validate the input
            validator_wrapper(unlike_content_validation(like_object))
            
            const result = await mongodb_like_queries.unlike_content(context.db_structure, like_object)
            return result
    
        },

    }
}