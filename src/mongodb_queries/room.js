const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const { CLOUD_FRONT_URL, TORNADO_ROOM_ID } = require("./../utils/constants")


//mutations resolvers

async function create_room(db_structure, room_object){

    //checking whether room already exists or not
    let room_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({"name":room_object.name})
    if (room_check){

        //checking whether the room is NOT_ACTIVE
        if (room_check.status==="NOT_ACTIVE"){

            const reactivate_res = await reactivate_room(db_structure, room_check._id.toString())
            //making the person follow the room 
            const follow_res = await toggle_follow_room(db_structure, room_object.creator_id, {room_id:reactivate_res._id, status:"ACTIVE"})
            return reactivate_res

        }else{
            throw new UserInputError(`Room with name:${room_object.name} already exists`)
        }
    }

    //creating new room 
    let room_value = {
        ...room_object,
        creator_id:ObjectID(room_object.creator_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
    }
    
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).insertOne(room_value)
    room_res = get_insert_one_result(room_res)
    const follow_res = await toggle_follow_room(db_structure, room_object.creator_id, {room_id:room_res._id, status:"ACTIVE"})
    
    room_res.room_members_count=1
    room_res.user_follows=true
    room_res.is_user=true

    return room_res

}

async function deactivate_room(db_structure, room_id){

    //updating the room with status:"NOT_ACTIVE"
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOneAndUpdate({
                                                                                                                    _id:ObjectID(room_id)    
                                                                                                                }, {
                                                                                                                    $set:{
                                                                                                                        status:"NOT_ACTIVE",
                                                                                                                        last_modified:new Date()
                                                                                                                    }
                                                                                                                }, { returnOriginal:false})

    room_res = room_res.value
                                                                                                     
    return room_res

}

async function reactivate_room(db_structure, room_id){

    //updating the room with status:"NOT_ACTIVE"
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOneAndUpdate({
                                                                                                                    _id:ObjectID(room_id)    
                                                                                                                }, {
                                                                                                                    $set:{
                                                                                                                        status:"ACTIVE",
                                                                                                                        last_modified:new Date()
                                                                                                                    }
                                                                                                                }, { returnOriginal:false})

    room_res = room_res.value                                                                                                        
                                                                                                                
    return room_res

}

async function toggle_follow_room(db_structure, user_id, toggle_follow_object){

    //check whether user has a entry or not
    let follow_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOne(
        {
            room_id:ObjectID(toggle_follow_object.room_id), 
            follower_id:ObjectID(user_id)
        })

    // if the follow_object exists
    if (follow_check){

        //checking whether the status is already equal to toggle_follow_object.status, if yes then simply return follow check object
        if (follow_check.status===toggle_follow_object.status){
            return follow_check
        }

        //change the status of the follow_object to toggle_follow_object.status
        let follow_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOneAndUpdate({
            _id:follow_check._id    
        }, {
            $set:{
                status:toggle_follow_object.status,
                last_modified:new Date()
            }
        }, { returnOriginal:false})

        follow_res = follow_res.value
        return follow_res
    }
    
    //follow object does not exists, follow the room
    let follow_value = {
        ...toggle_follow_object,
        room_id:ObjectID(toggle_follow_object.room_id),
        follower_id:ObjectID(user_id),
        timestamp:new Date(),
        last_modified:new Date(),
    }
    let follow_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).insertOne(follow_value)
    follow_result = get_insert_one_result(follow_result)
    return follow_result
}

//this should only be used when you are sure that no rooms in bulk_follow_object already being followed by user
//If any of the rooms in the request is already being followed by user, then this will result in redundancy & glitches
//Also you cannot user bulk_follow for reactivation as of now
async function bulk_follow_rooms(db_structure, bulk_follow_room_object){

    //populating all the room_follow objects
    let popu_follow_room_object = []
    bulk_follow_room_object.forEach(follow_object => {
        popu_follow_room_object.push({
            ...follow_object,
            room_id:ObjectID(follow_object.room_id),
            follower_id:ObjectID(follow_object.follower_id),
            timestamp:new Date(),
            last_modified:new Date(),
            status:"ACTIVE"
        })
    });

    let bulk_follow_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).insertMany(popu_follow_room_object)
    return bulk_follow_result.ops

}

async function follow_tornado(db_structure, user_id){

    const res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({name:"tornado"})

    //if no room named tornado, then return
    if(!res){
        return
    }

    //toggle follow room tornado
    const toggle_follow_res = await toggle_follow_room(db_structure, user_id, {
        room_id:res._id,
        status:"ACTIVE"
    })

    return res

}

//queries resolvers

//this is just an helper function for get_room_posts_user_id
async function find_followed_rooms(db_structure, user_id){
    const room_objects = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).find({follower_id:ObjectID(user_id), status:"ACTIVE"}).toArray()
    return room_objects
}

async function get_rooms(db_structure, user_id, filter_object){

    //extracting name_filter
    let name_filter = ""
    if(filter_object && filter_object.name_filter){
        name_filter=filter_object.name_filter
    }
    name_filter=name_filter.toLowerCase() //converting name filter of lower case, as all room_names are in lower case

    //removing spaces from filter (optimization step)
    if(name_filter.length!==0){
        let temp_filter = ""
        for (ch of name_filter){
            if(ch!==" "){
                temp_filter+=ch
            }
        }
        name_filter=temp_filter
    }
    
    //getting the rooms with populated bool value of whether user follows the room or not
    const rooms = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).aggregate(
        [
            // if the name filter is not undefined then run the text query, otherwise return all rooms
            name_filter.length!==0?
                {$match: {status:"ACTIVE", name:new RegExp(name_filter, "i")}}:
                {$match: {status:"ACTIVE"}},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                ],
                            }
                        }
                    },
                    {$count:"members_count"}
                ],
                as:"room_members_count_dev"
            }},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                {$eq:["$follower_id", ObjectID(user_id)]},
                                {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"user_follow_count"},
                    {$project:{
                        did_user_follow:{
                            $cond:{
                                if:{ $eq:[0, "$user_follow_count"]},
                                then: false,
                                else: true
                            }
                        }
                    }},
                ],
                as:"user_follows_dev"
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
            {$addFields:{
                room_members_count:{
                    $cond:{
                        if: {$eq:[{$size:"$room_members_count_dev"}, 0]},
                        then:0,
                        else:{$arrayElemAt: [ "$room_members_count_dev.members_count", 0 ] }
                    } 
                },
                user_follows:{
                    $cond:{
                        if: {$eq:[{$size:"$user_follows_dev"}, 0]},
                        then:false,
                        else:{$arrayElemAt: [ "$user_follows_dev.did_user_follow", 0 ] }
                    } 
                },
                creator_info:{
                    $cond:{
                        if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                        then:null,
                        else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                    }
                },
                is_user:{
                    $cond:{
                        if: {$eq:[ObjectID(user_id), "$creator_id"]},
                        then:true, 
                        else:false
                    }
                }
            }},
            {$project:{
                room_members_count_dev:0,
                user_follows_dev:0,
                creator_info_dev:0
            }}
        ]
    ).toArray()
    return rooms

}

async function get_not_joined_rooms(db_structure, user_id){
    
    // const result = await helper_get_followed_rooms(db_structure, user_id)
    const rooms = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).aggregate([

        {$match: {status:"ACTIVE"}},
        {$lookup:{
            from:db_structure.main_db.collections.room_follows,
            let:{room_identification:"$_id"},
            pipeline:[
                {$match:{
                    $expr:{
                        $and:[
                            {$eq:["$room_id", "$$room_identification"]},
                            {$eq:["$follower_id", ObjectID(user_id) ]},
                            {$eq:["$status", "ACTIVE" ]} 
                            ],
                        }
                    }
                },
                {$count:"user_follow_count"},
                {$project:{
                    can_join:{
                        $cond:{
                            if:{ $eq:[0, "$user_follow_count"]},
                            then: true,
                            else: false
                        }
                    }
                }},
            ],
            as:"user_join_dev"
        }},
        {$addFields:{
            user_join:{
                $cond:{
                    if: {$eq:[{$size:"$user_join_dev"}, 0]},
                    then:true,
                    else:{$arrayElemAt: [ "$user_join_dev.can_join", 0 ] }
                } 
            },
        }},
        {$match:{user_join:true}},
        {$lookup:{
            from:db_structure.main_db.collections.room_follows,
            let:{room_identification:"$_id"},
            pipeline:[
                {$match:{
                    $expr:{
                        $and:[
                            {$eq:["$room_id", "$$room_identification"]},
                            ],
                        }
                    }
                },
                {$count:"members_count"}
            ],
            as:"room_members_count_dev"
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
        {$addFields:{
            user_follows:false,
            room_members_count:{
                $cond:{
                    if: {$eq:[{$size:"$room_members_count_dev"}, 0]},
                    then:0,
                    else:{$arrayElemAt: [ "$room_members_count_dev.members_count", 0 ] }
                } 
            },
            creator_info:{
                $cond:{
                    if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                    then:null,
                    else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                }
            },
            is_user:{
                $cond:{
                    if: {$eq:[ObjectID(user_id), "$creator_id"]},
                    then:true, 
                    else:false
                }
            }
        }},
        {$project:{
            user_join:0,
            user_join_dev:0,
            creator_info_dev:0
        }}
        
    ]).toArray()

    return rooms

}


async function get_all_joined_rooms(db_structure, user_id){

    const rooms = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).aggregate(
        [
            {$match: {status:"ACTIVE"}},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                {$eq:["$follower_id", ObjectID(user_id) ]},
                                {$eq:["$status","ACTIVE"]}
                                ],
                            }
                        }
                    },
                ],
                as:"user_follow_room_dev"
            }},
            {$addFields:{
                user_follows:{
                    $cond:{
                        if: {$eq:[{$size:"$user_follow_room_dev"}, 0]},
                        then:false,
                        else:true
                    } 
                },
            }},
            {$match: {user_follows:true}},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                ],
                            }
                        }
                    },
                    {$count:"members_count"}
                ],
                as:"room_members_count_dev"
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
            {$addFields:{
                room_members_count:{
                    $cond:{
                        if: {$eq:[{$size:"$room_members_count_dev"}, 0]},
                        then:0,
                        else:{$arrayElemAt: [ "$room_members_count_dev.members_count", 0 ] }
                    } 
                },
                creator_info:{
                    $cond:{
                        if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                        then:null,
                        else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                    }
                },
                is_user:{
                    $cond:{
                        if: {$eq:[ObjectID(user_id), "$creator_id"]},
                        then:true, 
                        else:false
                    }
                }
            }},
            {$project:{
                user_follow_room_dev:0,
                room_members_count_dev:0,
                creator_info_dev:0
            }}
        ]
    ).toArray()

    return rooms

}

async function get_all_created_rooms(db_structure, creator_user_id, current_user_id){
    //getting the rooms with populated bool value of whether user follows the room or not
    const rooms = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).aggregate(
        [
            {$match: {status:"ACTIVE", creator_id:ObjectID(creator_user_id)}},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                {$eq:["$follower_id", ObjectID(current_user_id) ]},
                                {$eq:["$status","ACTIVE"]}
                                ],
                            }
                        }
                    },
                ],
                as:"user_follow_room_dev"
            }},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                ],
                            }
                        }
                    },
                    {$count:"members_count"}
                ],
                as:"room_members_count_dev"
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
            {$addFields:{
                room_members_count:{
                    $cond:{
                        if: {$eq:[{$size:"$room_members_count_dev"}, 0]},
                        then:0,
                        else:{$arrayElemAt: [ "$room_members_count_dev.members_count", 0 ] }
                    } 
                },
                creator_info:{
                    $cond:{
                        if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                        then:null,
                        else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                    }
                },
                user_follows:{
                    $cond:{
                        if: {$eq:[{$size:"$user_follow_room_dev"}, 0]},
                        then:false,
                        else:true
                    } 
                },
                is_user:{
                    $cond:{
                        if:{$eq:[ObjectID(current_user_id), "$creator_id"]},
                        then:true,
                        else:false                        
                    }
                }
            }},
            {$project:{
                user_follow_room_dev:0,
                creator_info_dev:0,
                room_members_count_dev:0
            }}
        ]
    ).toArray()
    return rooms
}

async function get_common_rooms(db_structure, user_id, user_id_arr){

    //convert all id strings into objectIds
    const user_id_arr_objectid = []
    user_id_arr.forEach(user_id => {
        user_id_arr_objectid.push(ObjectID(user_id))
    });

    //getting all room_follows object matching any user_id in the user_id_arr
    const common_room_ids_obj = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).aggregate(
        [
            {$match:{follower_id:{$in: user_id_arr_objectid}}},
            {
                $group: {_id:"$room_id", count:{$sum:1}}
            },
            {$match:{count:{$gte:user_id_arr_objectid.length}}},
            {$project:{
                _id:1
            }}
        ]
    ).toArray()
    let common_room_ids = []

    common_room_ids_obj.forEach(room_obj=>{
        common_room_ids.push(room_obj._id)
    })

    //getting the rooms with populated bool value of whether user follows the room or not
    const rooms = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).aggregate(
        [

            {$match: {status:"ACTIVE", _id:{$in:common_room_ids}}},
            {$lookup:{
                from:db_structure.main_db.collections.room_follows,
                let:{room_identification:"$_id"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $and:[
                                {$eq:["$room_id", "$$room_identification"]},
                                ],
                            }
                        }
                    },
                    {$count:"members_count"}
                ],
                as:"room_members_count_dev"
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
            {$addFields:{
                user_follows:true,
                room_members_count:{
                    $cond:{
                        if: {$eq:[{$size:"$room_members_count_dev"}, 0]},
                        then:0,
                        else:{$arrayElemAt: [ "$room_members_count_dev.members_count", 0 ] }
                    } 
                },
                creator_info:{
                    $cond:{
                        if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                        then:null,
                        else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                    }
                },
                is_user:{
                    $cond:{
                        if: {$eq:[ObjectID(user_id), "$creator_id"]},
                        then:true, 
                        else:false
                    }
                }
            }},
            {$project:{
                user_follow_room_dev:0,
                user_follows_rooms:0,
                room_members_count_dev:0
            }}
        ]
    ).toArray()

    return rooms
}

async function get_room_demographics(db_structure, room_id, user_id){

    const rooms = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).aggregate([
        {$match:{_id:ObjectID(room_id)}},
        {$lookup:{
            from:db_structure.main_db.collections.room_follows,
            let:{room_identification:"$_id"},
            pipeline:[
                {$match:{
                    $expr:{
                        $and:[
                            {$eq:["$room_id", "$$room_identification"]},
                            {$eq:["$follower_id", ObjectID(user_id) ]},
                            {$eq:["$status","ACTIVE"]}
                            ],
                        }
                    }
                },
            ],
            as:"user_follow_room_dev"
        }},
        {$lookup:{
            from:db_structure.main_db.collections.room_follows,
            let:{room_identification:"$_id"},
            pipeline:[
                {$match:{
                    $expr:{
                        $and:[
                            {$eq:["$room_id", "$$room_identification"]},
                            ],
                        }
                    }
                },
                {$count:"members_count"}
            ],
            as:"room_members_count_dev"
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
        {$addFields:{            
            room_members_count:{
                $cond:{
                    if: {$eq:[{$size:"$room_members_count_dev"}, 0]},
                    then:0,
                    else:{$arrayElemAt: [ "$room_members_count_dev.members_count", 0 ] }
                } 
            },
            creator_info:{
                $cond:{
                    if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                    then:null,
                    else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                }
            },
            user_follows:{
                $cond:{
                    if: {$eq:[{$size:"$user_follow_room_dev"}, 0]},
                    then:false,
                    else:true
                } 
            },
            is_user:{
                $cond:{
                    if: {$eq:[ObjectID(user_id), "$creator_id"]},
                    then:true, 
                    else:false
                }
            }
        }},
        {$project:{
            user_follow_room_dev:0,
            room_members_count_dev:0,
            creator_info_dev:0
        }}

    ]).toArray()
    return rooms[0]
}

async function check_room_name(db_structure, room_name){

    const room = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({name:room_name})
    if(room){
        return true
    }else{
        return false
    }

}

async function get_room_members_list(db_structure, user_id, room_id){

    //get follow objects of the room
    const room_follow_objects = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).find({
        room_id:ObjectID(room_id),
        status:"ACTIVE"
    }).toArray()
    
    //get user_ids
    const user_ids = []
    room_follow_objects.forEach(element=>{
        user_ids.push(ObjectID(element.follower_id))
    })

    // getting type User_account_small for each account
    let user_info_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).aggregate([
        {$match: {user_id:{$in:user_ids}}},
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
            },
            is_user:{
                $cond:{
                    if: {$eq:[ObjectID(user_id), "$user_id"]},
                    then:true, 
                    else:false
                }
            }
        }},
        {$project:{
            _id:1, 
            user_id:1, 
            username:1, 
            default_avatar:1,
            avatar:1,
            is_user:1
        }}
    ]).toArray()

    return user_info_list

}

module.exports = {

    //mutations
    create_room,
    deactivate_room,
    reactivate_room,
    toggle_follow_room,
    bulk_follow_rooms,
    follow_tornado,

    //queries
    find_followed_rooms,
    get_rooms,
    get_not_joined_rooms,
    get_all_joined_rooms,
    get_all_created_rooms,
    get_common_rooms,
    get_room_demographics,
    get_room_members_list,

    //room input extra checks
    check_room_name


}



