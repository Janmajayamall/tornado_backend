const mongodb_vote_queries = require("./../../mongodb_queries/vote")
const {validator_wrapper, toggle_vote_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")
const {db_instance_validation} = require("./../../utils/general_checks")

module.exports = {
    Mutation:{

        async toggle_vote(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
        
            const vote_object = args.user_input
            //validate the input 
            validator_wrapper(toggle_vote_validation(vote_object))

            const result = await mongodb_vote_queries.toggle_vote(context.db_structure, user_id,vote_object)
            return result
        },
    },


}