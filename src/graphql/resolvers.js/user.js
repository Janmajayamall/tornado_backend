const mongodb_user = require("./../../mongodb_queries/user")
const {user_register_validation, user_login_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{
        async register_user(parent, args, context){

            const user_object = args.user_input

            //Validate the args
            validation_result = user_register_validation(user_object)
            if (!validation_result.valid){
                throw new UserInputError("Error", {
                    errors: validation_result.errors
                })
            }

            result = await mongodb_user.register_user(context.dbs, user_object)

            return result 

        },

        async login_user(parent, args, context){

            const user_object = args.user_input

            //Validate the args
            validation_result = user_login_validation(user_object)
            if (!validation_result.valid){
                throw new UserInputError("Error", {
                    errors: validation_result.errors
                })
            } 

            result = await mongodb_user.login_user(context.dbs, user_object)

            return result

        }
    }
}