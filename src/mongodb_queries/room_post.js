const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result, get_objectids_array} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const mongodb_room_queries = require('./room')
const {CLOUD_FRONT_URL} = require("./../utils/constants")

async function create_room_post(db_structure, room_post_object){
    //create room_post_value for insert
    let room_post_value = {
        creator_id:ObjectID(room_post_object.creator_id),
        description:room_post_object.description,
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        room_ids:get_objectids_array(room_post_object.room_ids),
        post_type:room_post_object.post_type
    }

    //if image object is included in the room_post_object
    let image_object_reference = undefined
    if(room_post_object.image){
        const image_object = {
            ...room_post_object.image,
            timestamp: new Date(),
            last_modified: new Date(),
            status:"ACTIVE"
        }
        let image_object_response = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.images).insertOne(image_object)
        image_object_response = get_insert_one_result(image_object_response)
        image_object_reference = image_object_response
        //adding image object _id to room_post_value
        room_post_value.image = image_object_response._id
    }

    let room_post_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).insertOne(room_post_value)
    room_post_res = get_insert_one_result(room_post_res)

    if (image_object_reference!==undefined){
        //adding cdn url to image_object_reference 
        image_object_reference.cdn_url = CLOUD_FRONT_URL
        room_post_res.image=image_object_reference
    }

    return room_post_res
}

async function deactivate_room_post(db_structure, room_post_id){

    //deactivate the room_post
    let room_post_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).findOneAndUpdate({
                                                                                                                                    _id:ObjectID(room_post_id),
                                                                                                                                }, {
                                                                                                                                    $set:{
                                                                                                                                        status:"NOT_ACTIVE",
                                                                                                                                        last_modified:new Date()
                                                                                                                                    }
                                                                                                                                }, { returnOriginal:false})

    room_post_res = room_post_res.value
    return room_post_res                                                                                                                                
}

async function edit_room_post(db_structure, room_post_id, room_post_edit_object){

    if (room_post_edit_object.room_ids){

        room_post_edit_object.room_ids = get_objectids_array(room_post_edit_object.room_ids)

    }

    //editing the current post
    let room_post_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).findOneAndUpdate({                                                                                                                                            
                                                                                                                                        _id:ObjectID(room_post_id),                                                                                                                                        
                                                                                                                                    }, {
                                                                                                                                        $set:{
                                                                                                                                            ...room_post_edit_object,
                                                                                                                                            last_modified:new Date()
                                                                                                                                        }
                                                                                                                                    }, { returnOriginal:false})

    room_post_res = room_post_res.value
    return room_post_res                                                                                                                                

}

//queries

async function get_room_posts_user_id(db_structure, user_id, get_room_post_object){
    
    //CONSTANTS
    const POST_LIMIT = 5
    const ROOM_POST_CURSOR = (new Date().getTime()).toString()
    
    //find rooms followed by the user
    const room_objects_arr = await mongodb_room_queries.find_followed_rooms(db_structure,user_id)
    if (room_objects_arr.length === 0){
        return []
    }
    const follow_room_ids = []
    room_objects_arr.forEach(room_object => {
        follow_room_ids.push(ObjectID(room_object.room_id))
    });

    //fixing the get_room_post_object
    if (!get_room_post_object.limit){
        get_room_post_object.limit = POST_LIMIT
    }
    if (!get_room_post_object.room_post_cursor){
        get_room_post_object.room_post_cursor = ROOM_POST_CURSOR
    }


    // getting the posts    
    const room_posts_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).aggregate(
        [
            {$match: { status: "ACTIVE", room_ids:{$in:follow_room_ids}, timestamp:{$lt:new Date(parseInt(get_room_post_object.room_post_cursor))}}},
            {$sort:{timestamp:-1}},
            {$limit: get_room_post_object.limit+1},
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$like_type", "ROOM_POST"]},
                                    {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"likes_count"},
                ],
                as:'likes_count_dev'
            }},
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$like_type", "ROOM_POST"]},
                                    {$eq:["$status", "ACTIVE"]},
                                    {$eq:["$user_id", ObjectID(user_id)]}
                                ],
                            }
                        }
                    },
                    {$count:"user_like_count"},
                    {$project:{
                        did_user_like:{
                            $cond:{
                                if:{ $eq:[0, "$user_like_count"]},
                                then: false,
                                else: true
                            }
                        }
                    }},
                ],
                as:'user_liked_dev'
            }},
            {$lookup:{
                from:db_structure.main_db.collections.user_accounts,
                let:{creator:"$creator_id"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$user_id", "$$creator"]}
                    }},
                    {$lookup:{
                        from:db_structure.main_db.collections.images,
                        let:{image_id:"$avatar"},
                        pipeline:[
                            {$match:{
                                $expr:{$eq:["$_id", "$$image_id"]}
                            }},
                            {$addFields:{
                                cdn_url:CLOUD_FRONT_URL
                            }}
                        ],                        
                        as:"avatar_dev"
                    }},
                    {$addFields:{
                        avatar:{
                            $cond:{
                                if:{$eq:[{$size:"$avatar_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: ["$avatar_dev", 0]}
                            }
                        }
                    }}, 
                    {$project:{
                        avatar_dev:0
                    }}
                ],
                as:"creator_info_dev"
            }},
            {$lookup:{
                from:db_structure.main_db.collections.images,
                let:{image_id:"$image"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$_id", "$$image_id"]}
                    }},
                    {$addFields:{
                        cdn_url:CLOUD_FRONT_URL
                    }}
                ],
                as:"image_dev"
            }},
            {
                $project:{
                    _id:1,
                    creator_id: 1,
                    img_url: 1,
                    description:1,
                    room_ids: 1,
                    timestamp:1, 
                    last_modified: 1,
                    status: 1,                    
                    likes_count:{
                        $cond:{
                            if: {$eq:[{$size:"$likes_count_dev"}, 0]},
                            then:0,
                            else:{$arrayElemAt: [ "$likes_count_dev.likes_count", 0 ] }
                        }
                    },
                    user_liked:{
                        $cond:{
                            if: {$eq:[{$size:"$user_liked_dev"}, 0]},
                            then:false,
                            else:{$arrayElemAt: [ "$user_liked_dev.did_user_like", 0 ]}
                        }
                        
                    },
                    creator_info:{
                        $cond:{
                            if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                            then:null,
                            else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                        }
                    },
                    image:{
                        $cond:{
                            if: {$eq:[{$size:"$image_dev"}, 0]},
                            then:null,
                            else:{$arrayElemAt: ["$image_dev", 0]}
                        }
                    }
                }
            }
        ]
    ).toArray()

    //more posts left after this
    let has_more = false

    //length of rooms_post_list
    let room_post_list_len = room_posts_list.length

    //checking length of array
    if (room_post_list_len === get_room_post_object.limit+1){
        has_more = true
        room_posts_list.pop()  //removing the extra post
        room_post_list_len-=1
    }

    //getting new room post cursor
    let new_cursor = get_room_post_object.room_post_cursor
    if (room_post_list_len>0){
        new_cursor = room_posts_list[room_post_list_len-1].timestamp
    }

    //combining result
    const result = {

        room_posts:room_posts_list,
        next_page: has_more,
        limit:get_room_post_object.limit,
        last_room_post_cursor:get_room_post_object.room_post_cursor,
        room_post_cursor:new_cursor

    }

    console.log(result)
    
    return result

}

async function get_room_posts_room_id(db_structure, user_id, get_room_post_object){

    //CONSTANTS
    const POST_LIMIT = 5
    const ROOM_POST_CURSOR = (new Date().getTime()).toString()

    //fixing the get_room_post_object
    if (!get_room_post_object.limit){
        get_room_post_object.limit = POST_LIMIT
    }
    if (!get_room_post_object.room_post_cursor){
        get_room_post_object.room_post_cursor = ROOM_POST_CURSOR
    }

    // getting the posts    
    const room_posts_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).aggregate(
        [
            {$match: { status: "ACTIVE", room_ids:ObjectID(get_room_post_object.room_id), timestamp:{$lt:new Date(parseInt(get_room_post_object.room_post_cursor))}}},
            {$sort:{timestamp:-1}},
            {$limit: get_room_post_object.limit+1},
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$like_type", "ROOM_POST"]},
                                    {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"likes_count"},
                ],
                as:'likes_count_dev'
            }},
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$like_type", "ROOM_POST"]},
                                    {$eq:["$status", "ACTIVE"]},
                                    {$eq:["$user_id", ObjectID(user_id)]}
                                ],
                            }
                        }
                    },
                    {$count:"user_like_count"},
                    {$project:{
                        did_user_like:{
                            $cond:{
                                if:{ $eq:[0, "$user_like_count"]},
                                then: false,
                                else: true
                            }
                        }
                    }},
                ],
                as:'user_liked_dev'
            }},
            {$lookup:{
                from:db_structure.main_db.collections.user_accounts,
                let:{creator:"$creator_id"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$user_id", "$$creator"]}
                    }},
                    {$lookup:{
                        from:db_structure.main_db.collections.images,
                        let:{image_id:"$avatar"},
                        pipeline:[
                            {$match:{
                                $expr:{$eq:["$_id", "$$image_id"]}
                            }},
                            {$addFields:{
                                cdn_url:CLOUD_FRONT_URL
                            }}
                        ],                        
                        as:"avatar_dev"
                    }},
                    {$addFields:{
                        avatar:{
                            $cond:{
                                if:{$eq:[{$size:"$avatar_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: ["$avatar_dev", 0]}
                            }
                        }
                    }}, 
                    {$project:{
                        avatar_dev:0
                    }}
                ],
                as:"creator_info_dev"
            }},
            {$lookup:{
                from:db_structure.main_db.collections.images,
                let:{image_id:"$image"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$_id", "$$image_id"]}
                    }},
                    {$addFields:{
                        cdn_url:CLOUD_FRONT_URL
                    }}
                ],
                as:"image_dev"
            }},
            {
                $project:{
                    _id:1,
                    creator_id: 1,
                    img_url: 1,
                    description:1,
                    room_ids: 1,
                    timestamp:1, 
                    last_modified: 1,
                    status: 1,
                    likes_count:{
                        $cond:{
                            if: {$eq:[{$size:"$likes_count_dev"}, 0]},
                            then:0,
                            else:{$arrayElemAt: [ "$likes_count_dev.likes_count", 0 ] }
                        }
                    },
                    user_liked:{
                        $cond:{
                            if: {$eq:[{$size:"$user_liked_dev"}, 0]},
                            then:false,
                            else:{$arrayElemAt: [ "$user_liked_dev.did_user_like", 0 ]}
                        }
                        
                    },
                    creator_info:{
                        $cond:{
                            if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                            then:null,
                            else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                        }
                    },
                    image:{
                        $cond:{
                            if: {$eq:[{$size:"$image_dev"}, 0]},
                            then:null,
                            else:{$arrayElemAt: ["$image_dev", 0]}
                        }
                    }
                }
            }
        ]
    ).toArray()

    //more posts left after this
    let has_more = false

    //length of rooms_post_list
    let room_post_list_len = room_posts_list.length

    //checking length of array
    if (room_post_list_len === get_room_post_object.limit+1){
        has_more = true
        room_posts_list.pop()  //removing the extra post
        room_post_list_len-=1
    }

    //getting new room post cursor
    let new_cursor = get_room_post_object.room_post_cursor
    if (room_post_list_len>0){
        new_cursor = room_posts_list[room_post_list_len-1].timestamp
    }

    //combining result
    const result = {

        room_posts:room_posts_list,
        next_page: has_more,
        limit:get_room_post_object.limit,
        last_room_post_cursor:get_room_post_object.room_post_cursor,
        room_post_cursor:new_cursor

    }

    return result

}

async function get_user_profile_posts(db_structure, user_id, get_user_profile_posts_object){    

    //CONSTANTS
    const POST_LIMIT = 5
    const ROOM_POST_CURSOR = (new Date().getTime()).toString()

    //fixing the get_user_profile_posts_object
    if (!get_user_profile_posts_object.limit){
        get_user_profile_posts_object.limit = POST_LIMIT
    }
    if (!get_user_profile_posts_object.room_post_cursor){
        get_user_profile_posts_object.room_post_cursor = ROOM_POST_CURSOR
    }


    // getting the posts    
    const room_posts_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).aggregate(
        [
            {$match: { status: "ACTIVE", creator_id:ObjectID(user_id), timestamp:{$lt:new Date(parseInt(get_user_profile_posts_object.room_post_cursor))}}},
            {$sort:{timestamp:-1}},
            {$limit: get_user_profile_posts_object.limit+1},
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$like_type", "ROOM_POST"]},
                                    {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"likes_count"},
                ],
                as:'likes_count_dev'
            }},
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$like_type", "ROOM_POST"]},
                                    {$eq:["$status", "ACTIVE"]},
                                    {$eq:["$user_id", ObjectID(user_id)]}
                                ],
                            }
                        }
                    },
                    {$count:"user_like_count"},
                    {$project:{
                        did_user_like:{
                            $cond:{
                                if:{ $eq:[0, "$user_like_count"]},
                                then: false,
                                else: true
                            }
                        }
                    }},
                ],
                as:'user_liked_dev'
            }},
            {$lookup:{
                from:db_structure.main_db.collections.user_accounts,
                let:{creator:"$creator_id"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$user_id", "$$creator"]}
                    }},
                    {$lookup:{
                        from:db_structure.main_db.collections.images,
                        let:{image_id:"$avatar"},
                        pipeline:[
                            {$match:{
                                $expr:{$eq:["$_id", "$$image_id"]}
                            }},
                            {$addFields:{
                                cdn_url:CLOUD_FRONT_URL
                            }}
                        ],                        
                        as:"avatar_dev"
                    }},
                    {$addFields:{
                        avatar:{
                            $cond:{
                                if:{$eq:[{$size:"$avatar_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: ["$avatar_dev", 0]}
                            }
                        }
                    }}, 
                    {$project:{
                        avatar_dev:0
                    }}
                ],
                as:"creator_info_dev"
            }},
            {$lookup:{
                from:db_structure.main_db.collections.images,
                let:{image_id:"$image"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$_id", "$$image_id"]}
                    }},
                    {$addFields:{
                        cdn_url:CLOUD_FRONT_URL
                    }}
                ],
                as:"image_dev"
            }},
            {
                $project:{
                    _id:1,
                    creator_id: 1,
                    img_url: 1,
                    description:1,
                    room_ids: 1,
                    timestamp:1, 
                    last_modified: 1,
                    status: 1,
                    likes_count:{
                        $cond:{
                            if: {$eq:[{$size:"$likes_count_dev"}, 0]},
                            then:0,
                            else:{$arrayElemAt: [ "$likes_count_dev.likes_count", 0 ] }
                        }
                    },
                    user_liked:{
                        $cond:{
                            if: {$eq:[{$size:"$user_liked_dev"}, 0]},
                            then:false,
                            else:{$arrayElemAt: [ "$user_liked_dev.did_user_like", 0 ]}
                        }
                        
                    },
                    creator_info:{
                        $cond:{
                            if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                            then:null,
                            else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                        }
                    },
                    image:{
                        $cond:{
                            if: {$eq:[{$size:"$image_dev"}, 0]},
                            then:null,
                            else:{$arrayElemAt: ["$image_dev", 0]}
                        }
                    }
                }
            }
        ]
    ).toArray()
    
    //more posts left after this
    let has_more = false

    //length of rooms_post_list
    let room_post_list_len = room_posts_list.length

    //checking length of array
    if (room_post_list_len === get_user_profile_posts_object.limit+1){
        has_more = true
        room_posts_list.pop()  //removing the extra post
        room_post_list_len-=1
    }

    //getting new room post cursor
    let new_cursor = get_user_profile_posts_object.room_post_cursor
    if (room_post_list_len>0){
        new_cursor = room_posts_list[room_post_list_len-1].timestamp
    }

    //combining result
    const result = {

        room_posts:room_posts_list,
        next_page: has_more,
        limit:get_user_profile_posts_object.limit,
        last_room_post_cursor:get_user_profile_posts_object.room_post_cursor,
        room_post_cursor:new_cursor

    }

    return result

}

module.exports = {

    //mutations 
    create_room_post,
    deactivate_room_post,
    edit_room_post,

    //queries
    get_room_posts_user_id,
    get_room_posts_room_id,
    get_user_profile_posts
}
