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
        status:String!,
        timestamp:String!,
        last_modified:String!,
        creator_id:ID!
    }

    # Mutation room input type  TODO:You might want to change status to ENUM from String
    input room_input {
        name:String!,
        creator_id:ID!,
    }

    type Follow_room {
        _id:ID!,
        room_id:ID!,
        follower_id:ID!,
        status:String!,
        timestamp:String!,
        last_modified:String!,
    }

    # Mutation follow_room input/unfollow
    input follow_room_input {
        room_id:ID!,
        follower_id:ID!,
    }

    type Like {
        _id:ID!,
        user_id:ID!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        like_type:String!,
        content_id:ID!
    }

    # Mutation create_like/unlike
    input create_like_input {
        user_id:ID!,
        like_type:String!,
        content_type:ID!
    }

    type Comment {
        _id:ID!,
        user_id:ID!,
        post_id:ID!,
        timestamp:String!,
        last_modified:String!,
        status:String!
    }

    # Mutation create_comment/deactivate_comment
    input create_comment_input {
        user_id:ID!,
        post_id:ID!
    }

    type Mutation {

        #user
        register_user(user_input:register_user_input):User!,
        login_user(user_input:login_user_input):User!,

        #rooms
        create_room(user_input:room_input):Room!,
        deactivate_room(_id:ID!):Room!,
        follow_room(user_input:follow_room_input):Follow_room!,
        reactivate_room(_id:ID!):Room!,
        unfollow_room(user_input:follow_room_input):Follow_room!,

        #likes
        create_like(user_input:create_like_input):Like!,
        unlike_content(user_input:create_like_input):Like!,

        #comments
        create_comment(user_input:create_comment_input):Comment!,
        deactivate_comment(user_id:create_comment_input):Comment!



    }


`;