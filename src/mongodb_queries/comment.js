const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const { CLOUD_FRONT_URL } = require("./../utils/constants")

async function create_comment(db_structure, comment_object){

    //create comment_value for insertOne operation
    let comment_value = {
        ...comment_object,
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        user_id:ObjectID(comment_object.user_id),
        content_id:ObjectID(comment_object.content_id)
    }
    let comment_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).insertOne(comment_value)
    comment_res = get_insert_one_result(comment_res)
    return comment_res

}

async function edit_comment(db_structure,comment_id, edit_comment_object){

    //editing the comment
    let comment_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).findOneAndUpdate({
                                                                                                                    "_id":ObjectID(comment_id)    
                                                                                                                    },{
                                                                                                                        $set:{
                                                                                                                            comment_body:edit_comment_object.comment_body,
                                                                                                                            status:"ACTIVE",
                                                                                                                            last_modified:new Date()
                                                                                                                        }
                                                                                                                    }, {returnOriginal:false})
                                                                                                                
    comment_res = comment_res.value
    return comment_res                                                                                                                    

}

async function delete_comment(db_structure, user_id, comment_id){

    //deactivating the comment
    let result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).findOneAndDelete(
        {
            _id:ObjectID(comment_id),
            user_id:ObjectID(user_id)
        }
    )
    
    result = result.value
    
    if(!result){
        return ""
    }
        
    return result._id                                                                                                                             
}

//queries

async function get_post_comments(db_structure, user_id, comment_query_object){


    const comments_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).aggregate([
        {$match: {status:"ACTIVE", content_id:ObjectID(comment_query_object.content_id), content_type:comment_query_object.content_type}},
        {$lookup:{
            from:db_structure.main_db.collections.user_accounts,
            let:{creator:"$user_id"},
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
            creator_info:{
                $cond:{
                    if: {$eq:[{$size:"$creator_info_dev"}, 0]},
                    then:null,
                    else:{$arrayElemAt: [ "$creator_info_dev", 0 ] }
                }
            },
            is_user:{
                $cond:{
                    if: {$eq:[ObjectID(user_id), "$user_id"]},
                    then:true,
                    else:false
                }
            },
        }},
        {$project:{
            creator_info_dev:0
        }}
    ]).toArray()

    return comments_list

}

module.exports = {

    create_comment,
    edit_comment,
    delete_comment,

    //queries
    get_post_comments

}
