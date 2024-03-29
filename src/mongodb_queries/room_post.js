const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result, get_objectids_array} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const mongodb_room_queries = require('./room')
const {CLOUD_FRONT_URL} = require("./../utils/constants")
const { get_user_info } = require("./user")
const sgMail = require('@sendgrid/mail');

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
    room_post_res = get_insert_one_result(room_post_res) //post has been created

    //populating image
    if (image_object_reference!==undefined){
        //adding cdn url to image_object_reference 
        image_object_reference.cdn_url = CLOUD_FRONT_URL
        room_post_res.image=image_object_reference
    }
    
    //populating likes_count & user_liked
    room_post_res.likes_count=0
    room_post_res.user_liked=false

    //getting room_objects
    const room_objects = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).find({_id:{$in:room_post_res.room_ids}}).toArray()
    room_post_res.room_objects=room_objects

    //creator_info
    const creator_info = await get_user_info(db_structure, room_post_res.creator_id)
    room_post_res.creator_info=creator_info

    //is_user the creator = true
    room_post_res.is_user=true

    return room_post_res 
}

async function deactivate_room_post(db_structure, room_post_id, user_id){

    //checking whether user is the creator of the post of not
    let room_post = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).findOne({_id:ObjectID(room_post_id)})

    if(!room_post ||!ObjectID(user_id).equals(room_post.creator_id)){
        
        return ""
    }

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
    return room_post_res._id                                                                                                                               
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

    //fixing the get_room_post_object
    if (!get_room_post_object.limit){
        get_room_post_object.limit = POST_LIMIT
    }
    if (!get_room_post_object.room_post_cursor){
        get_room_post_object.room_post_cursor = ROOM_POST_CURSOR
    }
    
    //find rooms followed by the user
    const room_objects_arr = await mongodb_room_queries.find_followed_rooms(db_structure,user_id)
    if (room_objects_arr.length === 0){
        //user is member of no room 
        return({
            room_posts:[],
            next_page: false,
            limit:get_room_post_object.limit,
            last_room_post_cursor:get_room_post_object.room_post_cursor,
            room_post_cursor:get_room_post_object.room_post_cursor
        })
    }
    const follow_room_ids = []
    room_objects_arr.forEach(room_object => {
        follow_room_ids.push(ObjectID(room_object.room_id))
    });

    
    // getting the posts    
    const room_posts_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_posts).aggregate(
        [
            {$match: { status: "ACTIVE", room_ids:{$in:follow_room_ids}, timestamp:{$lt:new Date(parseInt(get_room_post_object.room_post_cursor))}}},
            // sorting descending order by time
            {$sort:{timestamp:-1}},
            // getting limit+1 documents (+1 is for indication whether more exist or not)
            {$limit: get_room_post_object.limit+1},
            // estimating like_dev count
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"likes_count"},
                ],
                as:'likes_count_dev'
            }},
            // lookup for whether users likes or not
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id", post_t:"$post_type"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
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
            // lookup for getting creator info
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
            // lookup for getting image_id using image(objectId)
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
            // look up getting all room objects in which user posted the post
            {$lookup: {
                from:db_structure.main_db.collections.rooms,
                let:{values_arr:`$room_ids`},
                pipeline:[
                    {$match:{
                            $expr:{$in:["$_id", "$$values_arr"]}
                        }
                    }
                ],
                as:'room_objects'
            }},
            //lookup for caption object for post type: ROOM_CAPTION_POST 
            {$lookup: {
                from:db_structure.main_db.collections.captions,
                let:{post:`$_id`},
                pipeline:[
                    {$match:{
                            $expr:{$and:[
                                {$eq:["$post_id", "$$post"]},
                                {$eq:["$status", "ACTIVE"]}
                            ]}
                    }},
                    {$limit:2},
                    //lookup for creator info for each caption object
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
                    //lookup for up votes count
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$vote_type", "UP"]}
                                        ],
                                    }
                                }
                            },
                            {$count:"up_votes"},
                        ],
                        as:'up_votes_count_dev'
                    }},
                    //lookup for down votes count
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$vote_type", "DOWN"]}
                                        ],
                                    }
                                }
                            },
                            {$count:"down_votes"},
                        ],
                        as:'down_votes_count_dev'
                    }},
                    //user vote object
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$creator_id", ObjectID(user_id)]}
                                        ],
                                    }
                                }
                            }
                        ],
                        as:'user_vote_object_dev'
                    }},
                    //addfields
                    {$addFields:{
                        up_votes_count:{
                            $cond:{
                                if: {$eq:[{$size:"$up_votes_count_dev"}, 0]},
                                then:0,
                                else:{$arrayElemAt: [ "$up_votes_count_dev.up_votes", 0 ] }
                            }
                        },
                        down_votes_count:{
                            $cond:{
                                if: {$eq:[{$size:"$down_votes_count_dev"}, 0]},
                                then:0,
                                else:{$arrayElemAt: [ "$down_votes_count_dev.down_votes", 0 ]}
                            }
                        },
                        creator_info:{
                            $cond:{
                                if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                            }
                        },
                        user_vote_object:{
                            $cond:{
                                if: {$eq:[{$size:"$user_vote_object_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: [ "$user_vote_object_dev", 0 ] }
                            }
                        },
                        is_user:{
                            $cond:{
                                if: {eq:[ObjectID(user_id), "$creator_id"]},
                                then:true,
                                else:false
                            }
                        }
                    }},                    
                    //sorting caption object with likes_count:1 timestamp:-1
                    {$sort:{
                        up_votes_count:-1,
                        down_votes_count:1
                    }},
                    {$project:{
                        creator_info_dev:0,
                        up_votes_count_dev:0,
                        down_votes_count_dev:0,
                        user_vote_object_dev:0
                    }}
                ],
                as:'caption_objects'
            }},
            // projecting selected fields, and converting _dev fields to finalized fields
            {$project:{
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
                    },
                    is_user:{
                        $cond:{
                            if: {$eq:[ObjectID(user_id), "$creator_id"]},
                            then:true,
                            else:false
                        }
                    },
                    post_type:1,
                    room_objects:1,
                    caption_objects:1
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
            // sorting descending order by time
            {$sort:{timestamp:-1}},
            // getting limit+1 documents (+1 is for indication whether more exist or not)
            {$limit: get_room_post_object.limit+1},
            // estimating like_dev count
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"likes_count"},
                ],
                as:'likes_count_dev'
            }},
            // lookup for whether users likes or not
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
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
            // lookup for getting creator info
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
            // lookup for getting image_id using image(objectId)
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
            // look up getting all room objects in which user posted the post
            {$lookup: {
                from:db_structure.main_db.collections.rooms,
                let:{values_arr:`$room_ids`},
                pipeline:[
                    {$match:{
                            $expr:{$in:["$_id", "$$values_arr"]}
                        }
                    }
                ],
                as:'room_objects'
            }},
            //lookup for caption object for post type: ROOM_CAPTION_POST 
            {$lookup: {
                from:db_structure.main_db.collections.captions,
                let:{post:`$_id`},
                pipeline:[
                    {$match:{
                            $expr:{$and:[
                                {$eq:["$post_id", "$$post"]},
                                {$eq:["$status", "ACTIVE"]}
                            ]}
                    }},
                    {$limit:2},
                    //lookup for creator info for each caption object
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
                    //lookup for up votes count
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$vote_type", "UP"]}
                                        ],
                                    }
                                }
                            },
                            {$count:"up_votes"},
                        ],
                        as:'up_votes_count_dev'
                    }},
                    //lookup for down votes count
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$vote_type", "DOWN"]}
                                        ],
                                    }
                                }
                            },
                            {$count:"down_votes"},
                        ],
                        as:'down_votes_count_dev'
                    }},
                    //user vote object
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$creator_id", ObjectID(user_id)]}
                                        ],
                                    }
                                }
                            }
                        ],
                        as:'user_vote_object_dev'
                    }},
                    //addfields
                    {$addFields:{
                        up_votes_count:{
                            $cond:{
                                if: {$eq:[{$size:"$up_votes_count_dev"}, 0]},
                                then:0,
                                else:{$arrayElemAt: [ "$up_votes_count_dev.up_votes", 0 ] }
                            }
                        },
                        down_votes_count:{
                            $cond:{
                                if: {$eq:[{$size:"$down_votes_count_dev"}, 0]},
                                then:0,
                                else:{$arrayElemAt: [ "$down_votes_count_dev.down_votes", 0 ]}
                            }
                        },
                        creator_info:{
                            $cond:{
                                if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                            }
                        },
                        user_vote_object:{
                            $cond:{
                                if: {$eq:[{$size:"$user_vote_object_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: [ "$user_vote_object_dev", 0 ] }
                            }
                        },
                        is_user:{
                            $cond:{
                                if: {eq:[ObjectID(user_id), "$creator_id"]},
                                then:true,
                                else:false
                            }
                        }
                    }},                    
                    //sorting caption object with likes_count:1 timestamp:-1
                    {$sort:{
                        up_votes_count:-1,
                        down_votes_count:1
                    }},
                    {$project:{
                        creator_info_dev:0,
                        up_votes_count_dev:0,
                        down_votes_count_dev:0,
                        user_vote_object_dev:0
                    }}
                ],
                as:'caption_objects'
            }},
            // projecting selected fields, and converting _dev fields to finalized fields
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
                    },
                    is_user:{
                        $cond:{
                            if: {$eq:[ObjectID(user_id), "$creator_id"]},
                            then:true,
                            else:false
                        }
                    },
                    post_type:1,
                    room_objects:1,
                    caption_objects:1
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

async function get_user_profile_posts(db_structure, get_user_profile_posts_object, current_user_id){    

    //extracting user_id
    const {user_id} = get_user_profile_posts_object
    

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
            // sorting descending order by time
            {$sort:{timestamp:-1}},
            // getting limit+1 documents (+1 is for indication whether more exist or not)
            {$limit: get_user_profile_posts_object.limit+1},
            // estimating like_dev count
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
                                    {$eq:["$status", "ACTIVE"]}
                                ],
                            }
                        }
                    },
                    {$count:"likes_count"},
                ],
                as:'likes_count_dev'
            }},
            // lookup for whether users likes or not
            {$lookup: {
                from:db_structure.main_db.collections.likes,
                let:{post_id:"$_id"},
                pipeline:[
                    {$match:{
                            $expr:{
                                $and:[
                                    {$eq:["$content_id", "$$post_id"]},
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
            // lookup for getting creator info
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
            // lookup for getting image_id using image(objectId)
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
            // look up getting all room objects in which user posted the post
            {$lookup: {
                from:db_structure.main_db.collections.rooms,
                let:{values_arr:`$room_ids`},
                pipeline:[
                    {$match:{
                            $expr:{$in:["$_id", "$$values_arr"]}
                        }
                    }
                ],
                as:'room_objects'
            }},
            //lookup for caption object for post type: ROOM_CAPTION_POST 
            {$lookup: {
                from:db_structure.main_db.collections.captions,
                let:{post:`$_id`},
                pipeline:[
                    {$match:{
                            $expr:{$and:[
                                {$eq:["$post_id", "$$post"]},
                                {$eq:["$status", "ACTIVE"]}
                            ]}
                    }},
                    {$limit:2},
                    //lookup for creator info for each caption object
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
                    //lookup for up votes count
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$vote_type", "UP"]}
                                        ],
                                    }
                                }
                            },
                            {$count:"up_votes"},
                        ],
                        as:'up_votes_count_dev'
                    }},
                    //lookup for down votes count
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$vote_type", "DOWN"]}
                                        ],
                                    }
                                }
                            },
                            {$count:"down_votes"},
                        ],
                        as:'down_votes_count_dev'
                    }},
                    //user vote object
                    {$lookup: {
                        from:db_structure.main_db.collections.votes,
                        let:{caption_id:"$_id"},
                        pipeline:[
                            {$match:{
                                    $expr:{
                                        $and:[
                                            {$eq:["$content_id", "$$caption_id"]},
                                            {$eq:["$content_type", "CAPTION"]},
                                            {$eq:["$status", "ACTIVE"]},
                                            {$eq:["$creator_id", ObjectID(user_id)]}
                                        ],
                                    }
                                }
                            }
                        ],
                        as:'user_vote_object_dev'
                    }},
                    //addfields
                    {$addFields:{
                        up_votes_count:{
                            $cond:{
                                if: {$eq:[{$size:"$up_votes_count_dev"}, 0]},
                                then:0,
                                else:{$arrayElemAt: [ "$up_votes_count_dev.up_votes", 0 ] }
                            }
                        },
                        down_votes_count:{
                            $cond:{
                                if: {$eq:[{$size:"$down_votes_count_dev"}, 0]},
                                then:0,
                                else:{$arrayElemAt: [ "$down_votes_count_dev.down_votes", 0 ]}
                            }
                        },
                        creator_info:{
                            $cond:{
                                if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                            }
                        },
                        user_vote_object:{
                            $cond:{
                                if: {$eq:[{$size:"$user_vote_object_dev"}, 0]},
                                then:null,
                                else:{$arrayElemAt: [ "$user_vote_object_dev", 0 ] }
                            }
                        },
                        is_user:{
                            $cond:{
                                if: {eq:[ObjectID(current_user_id), "$creator_id"]},
                                then:true,
                                else:false
                            }
                        }
                    }},                    
                    //sorting caption object with likes_count:1 timestamp:-1
                    {$sort:{
                        up_votes_count:-1,
                        down_votes_count:1
                    }},
                    {$project:{
                        creator_info_dev:0,
                        up_votes_count_dev:0,
                        down_votes_count_dev:0,
                        user_vote_object_dev:0
                    }}
                ],
                as:'caption_objects'
            }},   
            // projecting selected fields, and converting _dev fields to finalized fields         
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
                    },
                    is_user:{
                        $cond:{
                            if: {$eq:[ObjectID(current_user_id), "$creator_id"]},
                            then:true,
                            else:false
                        }
                    },
                    post_type:1,
                    room_objects:1,
                    caption_objects:1
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

async function report_post(db_structure, user_id, report_post_object){

    const user = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).findOne({_id:ObjectID(user_id)})
    const user_email = user.email

    const msg = {
        from:{
            "email":"tornado.helpdesk.in@gmail.com"
         },
        personalizations:[
            {
               to:[
                    {
                        email:"tornado.helpdesk.in@gmail.com"
                    }
               ],
               dynamic_template_data:{
                  user_email:user_email,
                  post_id:report_post_object.post_id,
                  reason:report_post_object.reason,
                  timestamp:new Date().toUTCString()
                }
            }
        ],
        template_id:"d-3673f2c0fcb948229e73fbe4a87c078d" // template ID of the email
    }


    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    //sending the code to user's email id
    try {
        const response = await sgMail.send(msg);   
        return true     
    } catch (error) {
        if (error.response) {
            bugsnap_client.notify(error.response.body)
            console.error(error.response.body,"password_recovery_send_code function | user.js" )
        }
        throw new ApolloError("Send grid Error", error)
    } 

}

module.exports = {

    //mutations 
    create_room_post,
    deactivate_room_post,
    edit_room_post,

    //queries
    get_room_posts_user_id,
    get_room_posts_room_id,
    get_user_profile_posts,

    //notifications
    report_post
}
