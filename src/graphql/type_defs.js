const {gql} = require("apollo-server-express")

module.exports = gql`



    #user info type
    #only used for login & registration;contains jwt
    type User {
        _id:ID!,
        username:String!,
        avatar:Image,
        jwt:String,
        email:String,
        age:Int,
        name:String, 
        three_words:String,
        bio:String,
        user_id:String!,
        default_avatar:Boolean!
    }

    #user account type
    type User_account {
        _id:ID!,
        user_id:ID!,
        age:Int!, 
        username:String!, 
        timestamp:String!, 
        last_modified:String!,
        name:String, 
        three_words:String,
        bio:String,
        avatar:Image,
        default_avatar:Boolean!
    }

    # image type 
    type Image {
        _id:ID!, 
        image_name:String!, 
        width:Int!, 
        height:Int!
        timestamp:String!,
        last_modified:String!, 
        cdn_url:String!,
        status:String!
    }
    
    # Mutation register_user input
    input register_user_input {
        email:String!,
        password:String!,
        age:Int!,
        username:String!,
        name:String!, 
        three_words:String!,
        bio:String!,
        avatar:image_input,
        default_avatar:Boolean!
    }

    # image input
    input image_input {
        image_name:String!, 
        width:Int!, 
        height:Int!
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

    # room with members_count & user follow bool 
    type Room_demographic {
        _id:ID!,
        name:String!,
        status:String!,
        timestamp:String!,
        last_modified:String!,
        creator_id:ID!,
        room_members_count:Int!,
        user_follows:Boolean!
    }

    # Mutation room input type  TODO:You might want to change status to ENUM from String
    input room_input {
        name:String!,
        creator_id:ID!,
        description:String!
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
        content_id:ID!
    }

    type Comment {
        _id:ID!,
        user_id:ID!,
        content_id:ID!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        comment_body:String!,
        content_type:String!
    }

    type Comment_with_creator {
        _id:ID!,
        user_id:ID!,
        content_id:ID!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        comment_body:String!,
        content_type:String!,
        creator_info:User_account!
    }

    # Mutation create_comment/deactivate_comment
    input create_comment_input {
        user_id:ID!,
        content_id:ID!,
        content_type:String!,
        comment_body:String!
    }

    input edit_comment_input {
        comment_body:String!
    }

    #Query get_post_comments
    input get_post_comments_input {
        content_id:ID!,
        content_type:String!
    }

    type Room_post {
        _id:ID!, 
        creator_id:ID!, 
        image:Image, 
        description:String!,
        room_ids:[ID!]!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        post_type:String!
    }   

    type Room_post_feed {
        _id:ID!, 
        creator_id:ID!, 
        image:Image, 
        description:String!,
        room_ids:[ID!]!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        post_type:String!
        creator_info:User_account!,
        likes_count:Int!,
        user_liked:Boolean!,
    }

    type Room_post_cursor {
        room_posts:[Room_post_feed!]!,
        next_page: Boolean!,
        limit: Int!,
        last_room_post_cursor: String!,
        room_post_cursor: String!
    }

    #Mutation create_room_post
    input create_room_post_input {
        creator_id:ID!,
        image:image_input,
        description:String!,
        room_ids:[ID!]!,
        post_type:String!,
    }

    #Query room_post_feed 
    input room_post_feed {
        limit:Int!,
        room_post_cursor:String
    }

    #Query room_details_feed
    input room_details_feed {
        limit:Int!, 
        room_post_cursor:String, 
        room_id:ID!
    }

    #Mutation edit_room_post
    input edit_room_post_input {
        img_url:String,
        vid_url:String,
        description:String,
        room_ids:[ID!],
    }

    #Query aws s3 getPresigned url input
    input get_image_upload_url_input{
        file_name:String!, 
        file_mime:String!,
    }

    type Mutation {

        #user
        register_user(user_input:register_user_input):User!,
        login_user(user_input:login_user_input):User!,

        #rooms
        create_room(user_input:room_input):Room_demographic!,
        deactivate_room(_id:ID!):Room!, 
        follow_room(user_input:follow_room_input):Follow_room!,
        bulk_follow_rooms(user_input:[follow_room_input!]!):[Follow_room!]!
        reactivate_room(_id:ID!):Room!,
        unfollow_room(user_input:follow_room_input):Follow_room!,

        #likes
        create_like(user_input:create_like_input):Like!,
        unlike_content(user_input:create_like_input):Like!,

        #comments
        create_comment(user_input:create_comment_input):Comment!,
        deactivate_comment(_id:ID!):Comment!,
        edit_comment(_id:ID!, user_input:edit_comment_input):Comment!

        #room_posts
        create_room_post(user_input:create_room_post_input):Room_post!
        edit_room_post(_id:ID!, user_input:edit_room_post_input):Room_post!
        deactivate_room_post(_id:ID!):Room_post!


    }

    type Query {

        #room_post
        get_room_posts_user_id(user_input:room_post_feed):Room_post_cursor,
        get_room_posts_room_id(user_input:room_details_feed):Room_post_cursor,
        get_user_profile_posts(user_input:room_post_feed):Room_post_cursor,

        #comments
        get_post_comments(user_input:get_post_comments_input):[Comment_with_creator!]!

        #rooms
        get_all_rooms:[Room_demographic!]!
        get_not_joined_rooms:[Room_demographic!]!
        get_all_joined_rooms:[Room_demographic!]!

        #aws s3 image upload access 
        get_image_upload_url(user_input:get_image_upload_url_input):String!
    
    }   


`;

