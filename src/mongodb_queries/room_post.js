const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result, get_objectids_array} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const mongodb_room_queries = require('./room')

async function create_room_post(db_structure, room_post_object){
    //create room_post_value for insert
    let room_post_value = {
        ...room_post_object,
        creator_id:ObjectID(room_post_object.creator_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        room_ids:get_objectids_array(room_post_object.room_ids)
    }
    let room_post_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).insertOne(room_post_value)
    room_post_res = get_insert_one_result(room_post_res)
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

    //implementing cursor based pagination
        //for getting room_posts for user feed we will be using cursor based pagination -- using timestamp
        // user_input:{

        //     last_loaded_component_timestamp (last_loaded_component_timestamp will be used as a cursor)

        //     limit (Number of room_posts to return)

        // }

        // return object:{

        //     user_id,
        //     room_posts --> list of room_posts
        //     last_post --> used for cursor
        //     has_next --> boolean value of whether most posts exists or not

        // }
    
    //find rooms followed by the user
    const room_objects_arr = await mongodb_room_queries.find_followed_rooms(db_structure,user_id)
    if (room_objects_arr.length === 0){
        return []
    }
    const follow_room_ids = []
    room_objects_arr.forEach(room_object => {
        follow_room_ids.push(ObjectID(room_object.room_id))
    });
    console.log(follow_room_ids)

    console.log(user_id, "this is new")
    // getting the posts
    // const room_posts = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).find({room_ids:{$in:follow_room_ids}, status:"ACTIVE"}).sort({timestamp:-1})  
    
    const result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).aggregate(
        [
            {$match: { status: "ACTIVE", room_ids:{$in:follow_room_ids}}},
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
                localField:"creator_id",
                foreignField:"user_id",
                as:"creator_info"
            }},
            {
                $project:{
                    creator_id: 1,
                    img_url: 1,
                    description:1,
                    room_ids: 1,
                    timestamp:1, 
                    last_modified: 1,
                    status: 1,
                    creator_info: 1,

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
                        
                    }
                }
            }
        ]
    ).toArray()

    //
    
    return result

    //TODO: Implement pagination as well


}

module.exports = {

    //mutations 
    create_room_post,
    deactivate_room_post,
    edit_room_post,

    //queries
    get_room_posts_user_id
}
