const mongodb_like_queries = require("./../../mongodb_queries/like")
const {create_like_validation, validator_wrapper, objectid_validation, toggle_like_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")
const {db_instance_validation} = require("./../../utils/general_checks")

module.exports = {
    Mutation:{

        async toggle_like(parent, args, context){

            //authenticating the user
           const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
        
            const like_object = args.user_input
            
            //Validate the input
            validator_wrapper(toggle_like_validation(like_object))
            
            const result = await mongodb_like_queries.toggle_like(context.db_structure, user_id, like_object)
            
            
            return result
            
        }

    }
}