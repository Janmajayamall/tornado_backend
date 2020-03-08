const {gql} = require("apollo-server-express")

module.exports = gql`

    type Query {
        test: String
    }

    type User {
        _id:ID!,
        username:String!,
        avatar:String!,
        jwt:String,
        email:String,
        dob:String
    }
    
    # Mutation register_user input
    input register_user_input {
        email:String!,
        password:String!,
        dob:String!,
        username:String!,
        avatar:String!
    }

    # Mutation login_user input
    input login_user_input {
        email:String!,
        password:String!
    }

    type Mutation {

        #user
        register_user(user_input:register_user_input):User!,
        login_user(user_input:login_user_input):User!
        
    }


`;