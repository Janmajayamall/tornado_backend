const user_resolvers = require("./user")
const room_resolvers = require("./rooms")
const room_post_resolvers = require("./room_posts")
const comment_resolvers = require("./comments")
const like_resolvers = require("./likes")
const aws_operations_resolvers = require("./aws_operations")

module.exports = {
    Mutation:{
        ...user_resolvers.Mutation,
        ...room_resolvers.Mutation,
        ...room_post_resolvers.Mutation,
        ...comment_resolvers.Mutation,
        ...like_resolvers.Mutation
    },
    Query:{
        ...room_post_resolvers.Query,
        ...comment_resolvers.Query,
        ...room_resolvers.Queries,
        ...aws_operations_resolvers.Query,
        ...user_resolvers.Query
    }
}