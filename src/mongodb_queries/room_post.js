const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result, get_objectids_array} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

async function create_room_post(db_structure, room_post_object){
    //TODO:CHECK WHY IS UPDATE RETURNING OLD DOCUMENT
    //create room_post_value for insert
    let room_post_value = {
        ...room_post_object,
        creator_id:ObjectID(room_post_object.creator_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        room_ids:get_objectids_array(room_post_object.room_ids)
    }
    console.log(room_post_value, "dawdawdaw")
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
                                                                                                                                }, { returnNewDocument:true})

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
                                                                                                                                    }, { returnNewDocument:true})

    room_post_res = room_post_res.value
    return room_post_res                                                                                                                                

}


module.exports = {

    create_room_post,
    deactivate_room_post,
    edit_room_post

}
