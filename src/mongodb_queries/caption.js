const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const { get_user_info } = require("./user")
const { CLOUD_FRONT_URL } = require("./../utils/constants")

async function create_caption(db_structure, user_id,caption_object){

    const final_caption_object = {
        post_id:ObjectID(caption_object.post_id),
        description:caption_object.description,
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        creator_id:ObjectID(user_id)
    }

    let caption_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.captions).insertOne(final_caption_object)
    caption_res = get_insert_one_result(caption_res)

    //setting up likes count & user_liked
    caption_res.likes_count=0
    caption_res.user_liked=false

    //creator_info
    const creator_info = await get_user_info(db_structure, user_id)
    caption_res.creator_info=creator_info     

    return caption_res
}

async function get_post_captions(db_structure, user_id, post_id){
    console.log(user_id, post_id)
    const captions = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.captions).aggregate(
        [
            {$match:{post_id:ObjectID(post_id), status:"ACTIVE"}},
            // lookup for creator_info
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
                }
            }}
        ]
    ).toArray()

    return captions

}




module.exports = {

    //mutations
    create_caption,

    //queries
    get_post_captions

}
