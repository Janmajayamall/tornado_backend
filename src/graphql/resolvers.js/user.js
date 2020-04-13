const mongodb_user_queries = require("./../../mongodb_queries/user")
const {user_register_validation, user_login_validation, validator_wrapper, objectid_validation, edit_profile_validation, password_change_with_code_validation} = require("./../../utils/validator")
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
            const edit_user_profile_object = args.user_input 
            //Validate the input 
            validator_wrapper(edit_profile_validation(edit_user_profile_object))

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

            // validate change_password_object
            validator_wrapper(password_change_with_code_validation(change_password_object))

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

            //check whether user_id already exists in args or not. If not then populate it with current user id
            let recv_user_id = args.user_id
            if(!recv_user_id){
                recv_user_id=user_id
            }

            validator_wrapper(objectid_validation(recv_user_id))

            const result = await mongodb_user_queries.get_user_info(context.db_structure, recv_user_id)
            return result
        },

        async check_email(parent, args, context){

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting email id
            const email = args.email

            if(!email){
                throw new UserInputError("Error", {
                    errors:{
                        email:"Email id is must"
                    }
                })
            }

            const result = await mongodb_user_queries.check_email(context.db_structure, email)
            
            return result
        },

        async check_username(parent, args, context){
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //checking whether authorization is present or not
            let user_id = undefined
            if(context.req_headers.authorization){
                user_id = await verify_jwt(context.req_headers.authorization)
            }
            

            //extracting username
            const username = args.username

            const result = await mongodb_user_queries.check_username(context.db_structure, username, user_id)
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