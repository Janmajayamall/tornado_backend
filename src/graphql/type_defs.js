const {gql} = require("apollo-server-express")

module.exports = gql`

    type Query {
        test: String
    }

    #user info type
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

    # room info type
    type Room {
        _id:ID!,
        name:String!,
        status:String!
    }

    # Mutation room input type  TODO:You might want to change status to ENUM from String
    input room_input {
        name:String!,
        status:String!,
        creator_id:ID!,
    }

    type Follow_room {
        room_id:ID!,
        follower_id:ID!,
        status:String!
    }

    # Mutation follow_room input
    input follow_room_input {
        room_id:ID!,
        follower_id:ID!,
        status:String!
    }

    type Mutation {

        #user
        register_user(user_input:register_user_input):User!,
        login_user(user_input:login_user_input):User!,

        #rooms
        create_room(user_input:room_input):Room!,
        deactivate_room(_id:ID!):Room!,
        follow_room(user_input:follow_room_input):Follow_room!,
        reactivate_room(_id:ID!):Room!
        


    }


`;