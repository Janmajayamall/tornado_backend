const user_resolvers = require("./user")
const room_resolvers = require("./rooms")
const room_post_resolvers = require('./room_posts')

module.exports = {
    Mutation:{
        ...user_resolvers.Mutation,
        ...room_resolvers.Mutation,
        ...room_post_resolvers.Mutation
    },
    Query:{
        
    }
}