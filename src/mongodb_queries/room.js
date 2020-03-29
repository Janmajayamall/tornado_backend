const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const { CLOUD_FRONT_URL } = require("./../utils/constants")

//mutations resolvers

async function create_room(db_structure, room_object){

    //checking whether room already exists or not
    let room_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({"name":room_object.name})
    if (room_check){

        //checking whether the room is NOT_ACTIVE
        if (room_check.status==="NOT_ACTIVE"){

            const reactivate_res = await reactivate_room(db_structure, room_check._id.toString())
            //making the person follow the room 
            const follow_res = await follow_room(db_structure, {room_id:reactivate_res._id, follower_id:room_object.creator_id})
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
    const follow_res = await follow_room(db_structure, {room_id:room_res._id, follower_id:room_res.creator_id})

    room_res.room_members_count=1
    room_res.user_follows=true

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

async function follow_room(db_structure, follow_object){

    //TODO: check whether room id active or not

    //checking whether follow object already exists or not
    let follow_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOne({room_id:ObjectID(follow_object.room_id), follower_id:ObjectID(follow_object.follower_id)})
    if (follow_check){

        //checking whether the follow status is active or not
        if (follow_check.status==="NOT_ACTIVE"){

            //change status to ACTIVE again
            let follow_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOneAndUpdate({
                                                                                                                                _id:follow_check._id    
                                                                                                                            }, {
                                                                                                                                $set:{
                                                                                                                                    status:"ACTIVE",
                                                                                                                                    last_modified:new Date()
                                                                                                                                }
                                                                                                                            }, { returnOriginal:false})
            
            follow_res = follow_res.value
                                                                                                                            
            return follow_res                                                                                                                            

        }else{

            return follow_check
        }
    }
    
    //following the room
    let follow_value = {
        ...follow_object,
        room_id:ObjectID(follow_object.room_id),
        follower_id:ObjectID(follow_object.follower_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE"
    }
    let follow_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).insertOne(follow_value)
    follow_result = get_insert_one_result(follow_result)
    return follow_result
}

async function unfollow_room(db_structure, follow_object){

    //updating the follow_room status to ACTIVE
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOneAndUpdate({
                                                                                                                        room_id:ObjectID(follow_object.room_id),
                                                                                                                        follower_id:ObjectID(follow_object.follower_id)    
                                                                                                                    }, {
                                                                                                                        $set:{
                                                                                                                            status:"NOT_ACTIVE",
                                                                                                                            last_modified:new Date()
                                                                                                                        }
                                                                                                                    }, { returnOriginal:false})
  
    room_res = room_res.value
                                                                                                                    
    return room_res
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

//queries resolvers

//this is just an helper function for get_room_posts_user_id
async function find_followed_rooms(db_structure, user_id){
    const room_objects = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).find({follower_id:ObjectID(user_id)}).toArray()
    return room_objects
}

async function get_all_rooms(db_structure, user_id){

    //getting the rooms with populated bool value of whether user follows the room or not
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

async function get_common_rooms(db_structure, user_id_arr){

    //convert all id strings into objectIds
    const user_id_arr_objectid = []
    user_id_arr.forEach(user_id => {
        user_id_arr_objectid.push(ObjectID(user_id))
    });
    console.log(user_id_arr_objectid)
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
    console.log(common_room_ids_obj, 'aw')
    common_room_ids_obj.forEach(room_obj=>{
        common_room_ids.push(room_obj._id)
    })
    console.log("common room ids ",common_room_ids )

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

module.exports = {

    //mutations
    create_room,
    deactivate_room,
    reactivate_room,
    follow_room,
    unfollow_room,
    bulk_follow_rooms,

    //queries
    find_followed_rooms,
    get_all_rooms,
    get_not_joined_rooms,
    get_all_joined_rooms,
    get_all_created_rooms,
    get_common_rooms,
    get_room_demographics


}



