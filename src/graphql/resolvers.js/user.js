const mongodb_user = require("./../../mongodb_queries/user")

module.exports = {
    Mutation:{
        async register_user(parent, args, context){

            //TODO: Validate the args

            user_object = args.user_input
            result = await mongodb_user.register_user(context.dbs, user_object)

            return result 

        },

        async login_user(parent, args){

            //TODO: Validate the args

            // result = await.mongodb_user

        }
    }
}