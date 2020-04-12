const {gql} = require("apollo-server-express")

module.exports = gql`



    #user info type
    #only used for login & registration;contains jwt
    type User {
        _id:ID!,
        username:String!,
        avatar:Image,
        jwt:String,
        age:Int,
        name:String, 
        three_words:String,
        bio:String,
        user_id:String!,
        default_avatar:Boolean!,
        timestamp:String!,
        last_modified:String!
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
        default_avatar:Boolean!,
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

    # Mutation edit_user_profile input
    input edit_user_profile_input{
        username:String!,
        name:String!,
        bio:String!, 
        three_words:String!,
        avatar:image_input,
        last_avatar_id:ID,
    }

    # room info type
    type Room {
        _id:ID!,
        name:String!,
        status:String!,
        timestamp:String!,
        last_modified:String!,
        creator_id:ID!,
        description:String!
    }

    # room with members_count & user follow bool 
    type Room_demographic {
        _id:ID!,
        name:String!,
        status:String!,
        timestamp:String!,
        last_modified:String!,
        creator_id:ID!,
        creator_info:User_account!, 
        room_members_count:Int!,
        user_follows:Boolean!,
        description:String!,
        is_user:Boolean!,
    }

    # Mutation room input type
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
    input bulk_follow_room_input {
        room_id:ID!,
        follower_id:ID!,
    }

    # Mutation toggle_follow_room_input 
    input toggle_follow_room_input {
        room_id:ID!,
        status:String!
    }

    type Like {
        _id:ID!,
        user_id:ID!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        content_id:ID!
    }

    # Mutation create_like/unlike
    input toggle_like_input {
        content_id:ID!,
        status:String!
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
        is_user:Boolean!
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
        room_objects:[Room!]!,
        caption_objects:[Caption!],
        is_user:Boolean!
    }

    type Caption {
        _id:ID!,
        post_id:ID!,
        creator_info:User_account!,
        timestamp:String!,
        last_modified:String!,
        status:String!,
        description:String!,     
        up_votes_count:Int!, 
        down_votes_count:Int!  
        user_vote_object:Vote,
        is_user:Boolean!
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

    #Mutation create_caption_input 
    input create_caption_input {
        post_id:ID!, 
        description:String!
    }

    #Query room_post_feed 
    input room_post_feed {
        limit:Int!,
        room_post_cursor:String
    }

    #Query room_post_other_user_id_feed
    input get_user_profile_posts_input {
        limit:Int!,
        room_post_cursor:String,
        user_id:ID
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

    #Mutation toggle_vote_input
    input toggle_vote_input{
        content_id:ID!, 
        vote_type:String!, 
        content_type:String!
    }

    # vote type
    type Vote {
        _id:ID!,
        content_id:ID!,
        creator_id:ID!, 
        vote_type:String!,
        status:String!,
        timestamp:String!, 
        last_modified:String!,
        content_type:String!
    }

    #Query get_rooms_input
    input get_rooms_input {
        name_filter:String
    }

    type Mutation {

        #user
        register_user(user_input:register_user_input):User!,
        login_user(user_input:login_user_input):User!,
        edit_user_profile(user_input:edit_user_profile_input):User_account!
        password_recovery_code_verification(verification_code:String!, password:String!):Boolean!

        #rooms
        create_room(user_input:room_input):Room_demographic!,
        deactivate_room(_id:ID!):Room!, 
        toggle_follow_room(user_input:toggle_follow_room_input):Follow_room!,
        bulk_follow_rooms(user_input:[bulk_follow_room_input!]!):[Follow_room!]!
        reactivate_room(_id:ID!):Room!,

        #likes
        toggle_like(user_input:toggle_like_input):Like!

        #comments
        create_comment(user_input:create_comment_input):Comment!,
        delete_comment(comment_id:ID!):ID!,
        edit_comment(_id:ID!, user_input:edit_comment_input):Comment!

        #room_posts
        create_room_post(user_input:create_room_post_input):Room_post_feed!
        edit_room_post(_id:ID!, user_input:edit_room_post_input):Room_post!
        deactivate_room_post(post_id:ID!):ID!

        #caption
        create_caption(user_input:create_caption_input):Caption!
        delete_caption(caption_id:ID!):ID!

        #votes
        toggle_vote(user_input:toggle_vote_input):Vote!

    }

    type Query {

        #room_post
        get_room_posts_user_id(user_input:room_post_feed):Room_post_cursor,
        get_room_posts_room_id(user_input:room_details_feed):Room_post_cursor,
        get_user_profile_posts(user_input:get_user_profile_posts_input):Room_post_cursor,

        #comments
        get_post_comments(user_input:get_post_comments_input):[Comment_with_creator!]!

        #rooms
        get_rooms(user_input:get_rooms_input):[Room_demographic!]!
        get_not_joined_rooms:[Room_demographic!]!
        get_all_joined_rooms(user_id:ID):[Room_demographic!]!
        get_all_created_rooms(user_id:ID):[Room_demographic!]!
        get_common_rooms(user_ids:[ID!]!):[Room_demographic!]!
        get_room_demographics(room_id:ID!):Room_demographic!
        check_room_name(room_name:String!):Boolean!

        #aws s3 image upload access 
        get_image_upload_url(user_input:get_image_upload_url_input):String!
    
        #user
        get_user_info(user_id:ID):User_account!
        check_email(email:String!):Boolean!
        check_username(username:String!):Boolean!
        password_recovery_send_code(email:String!):Boolean!

        #captions
        get_post_captions(post_id:ID!):[Caption!]!

    }   


`;

