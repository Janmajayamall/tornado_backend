const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

async function create_room(db_structure, room_object){

    //checking whether room already exists or not
    let room_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({"name":room_object.name})
    if (room_check){
        throw new UserInputError(`Room with name:${room_object.name} already exists`)
    }

    //creating new room 
    let room_value = {
        ...room_object,
        creator_id:ObjectID(room_object.creator_id),
        timestamp:new Date(),
        last_modified:new Date()
    }
    
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).insertOne(room_value)
    room_res = get_insert_one_result(room_res)

    return {
        _id:room_res._id, 
        name:room_res.name,
        status:room_res.status
    }

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
                                                                                                                }, { returnNewDocument:true})
    return room_res.value

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
                                                                                                                }, { returnNewDocument:true})
    return room_res.value

}

async function follow_room(db_structure, follow_object){

    //checking whether follow object already exists or not
    let follow_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOne({room_id:ObjectID(follow_object.room_id), follower_id:ObjectID(follow_object.follower_id)})
    if (follow_check){
        return {
            room_id:follow_check.room_id,
            follower_id:follow_check.follower_id,
            status:follow_check.status
        }
    }

    //TODO: If exists and NOT_ACTIVE, then reactivate
    
    //following the room
    let follow_value = {
        ...follow_object,
        room_id:ObjectID(follow_object.room_id),
        follower_id:ObjectID(follow_object.follower_id),
        timestamp:new Date(),
        last_modified:new Date()
    }
    let follow_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).insertOne(follow_value)
    follow_result = get_insert_one_result(follow_result)

    return {
        room_id:follow_result.room_id,
        follower_id:follow_result.follower_id,
        status:follow_result.status
    }

}

//TODO: add unfollow




module.exports = {
    create_room,
    deactivate_room,
    reactivate_room
}