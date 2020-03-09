const user_resolvers = require("./user")
const room_resolvers = require("./rooms")

module.exports = {
    Mutation:{
        ...user_resolvers.Mutation,
        ...room_resolvers.Mutation
    },
    Query:{
        
    }
}