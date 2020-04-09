const mongodb_user_queries = require("./../../mongodb_queries/user")
const {user_register_validation, user_login_validation, validator_wrapper, objectid_validation} = require("./../../utils/validator")
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
            console.log(validation_result)
            if (!validation_result.valid){
                throw new UserInputError("Error", {
                    errors: validation_result.errors
                })
            }
            
            console.log(user_object)
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
        },

        async password_recovery_code_verification(parent, args, context){
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting email
            const change_password_object = {
                password:args.password, 
                verification_code:args.verification_code
            }

            //TODO: validate change_password_object

            const result = await mongodb_user_queries.password_recovery_code_verification(context.db_structure, change_password_object)
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
        },

        async get_other_user_info(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting other_user_id and validating it
            const other_user_id = args.other_user_id
            validator_wrapper(objectid_validation(other_user_id))

            const result = await mongodb_user_queries.get_user_info(context.db_structure, user_id)
            return result        
        },

        async check_email(parent, args, context){

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting email id
            const email = args.email

            const result = await mongodb_user_queries.check_email(context.db_structure, email)
            console.log(result)
            return result
        },

        async check_username(parent, args, context){
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting username
            const username = args.username

            const result = await mongodb_user_queries.check_username(context.db_structure, username)
            return result
        },

        async password_recovery_send_code(parent, args, context){
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting email
            const email = args.email

            const result = await mongodb_user_queries.password_recovery_send_code(context.db_structure, email)
            return result
        },

    }
}