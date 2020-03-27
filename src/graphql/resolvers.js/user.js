const mongodb_user_queries = require("./../../mongodb_queries/user")
const {user_register_validation, user_login_validation,} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {db_instance_validation} = require("./../../utils/general_checks")
const {verify_jwt} = require("./../../utils/authentication")

module.exports = {
    Mutation:{
        async register_user(parent, args, context){

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const user_object = args.user_input
            //Validate the args
            validation_result = user_register_validation(user_object)
            if (!validation_result.valid){
                throw new UserInputError("Error", {
                    errors: validation_result.errors
                })
            }
            

            result = await mongodb_user_queries.register_user(context.db_structure, user_object)

            return result 

        },

        async login_user(parent, args, context){

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const user_object = args.user_input
            //Validate the args
            validation_result = user_login_validation(user_object)
            if (!validation_result.valid){
                throw new UserInputError("Error", {
                    errors: validation_result.errors
                })
            } 

            result = await mongodb_user_queries.login_user(context.db_structure, user_object)

            return result

        },

        async edit_user_profile(parent, args, context){

            // authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //edit_user_profile_object from user_input
            const edit_user_profile_object = args.user_input //TODO: Validate the input 

            const result = await mongodb_user_queries.edit_user_profile(context.db_structure, user_id, edit_user_profile_object)
            return result
        }
    },

    Query:{

        async get_user_info(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const result = await mongodb_user_queries.get_user_info(context.db_structure, user_id)
            return result
        }

    }
}