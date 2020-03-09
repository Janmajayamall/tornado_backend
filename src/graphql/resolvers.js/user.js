const mongodb_user_queries = require("./../../mongodb_queries/user")
const {user_register_validation, user_login_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{
        async register_user(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

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
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

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

        }
    }
}