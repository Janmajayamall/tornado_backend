const db_structure = require("./../db_structure")

// user

async function create_user_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.users, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["email", "hash", "timestamp", "last_modified"],
                properties:{
                    email:{
                        bsonType:"string",
                        description:"email must be a url(type:string) and is required"
                    },
                    hash:{
                        bsonType:"string",
                        description:"password must be a string and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be a date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    }
                }
            }
        }
    })
    return result
}


//user_account
async function create_user_account_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.user_accounts, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["user_id", "dob", "username", "avatar", "timestamp", "last_modified"],
                properties:{
                    user_id:{
                        bsonType:"objectId",
                        description:"user_id must be a objectId and is required"
                    },
                    dob:{
                        bsonType:"date",
                        description:"dob (date of birth) must be a date(ISODate) and is required"
                    },
                    username:{
                        bsonType:"string",
                        description:"username must be a string and is required"
                    },
                    avatar:{
                        bsonType:"string",
                        description:"avatar must be a url(type:string) and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be a date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    }
                }
            }
        }
    })
    return result
}

//room
async function create_room_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.rooms, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["creator_id", "timestamp", "name", "last_modified", "status"],
                properties:{
                    creator_id:{
                        bsonType:"objectId",
                        description:"creator_id must be a objectId and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be a date(ISODate) and is required"
                    },
                    name:{
                        bsonType:"string",
                        description:"name must be a name and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    },
                    status:{
                        enum:["ACTIVE", "NOT_ACTIVE"],
                        description:"status must be ACTIVE or NOT_ACTIVE and is required"
                    }
                }
            }
        }
    })
    return result
}

//room follow
async function create_room_follow_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.room_follows, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["room_id", "follower_id", "timestamp", "status", "last_modified"],
                properties:{
                    room_id:{
                        bsonType:"objectId",
                        description:"room_id must be a objectId and is required"
                    },
                    follower_id:{
                        bsonType:"objectId",
                        description:"follower_id must be a objectId and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be a date(ISODate) and is required"
                    },
                    status:{
                        enum:["ACTIVE", "NOT_ACTIVE"],
                        description:"status must be ACTIVE or NOT_ACTIVE and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    },
                }
            }
        }
    })
    return result
}

async function create_room_post_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.room_posts, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["creator_id", "timestamp", "last_modified", "status", "room_ids"],
                properties:{
                    creator_id:{
                        bsonType:"objectId",
                        description:"creator_id must be a objectId and is required"
                    },
                    img_url:{
                        bsonType:"string",
                        description:"img_url must be a string and is required"
                    },
                    vid_url:{
                        bsonType:"string",
                        description:"vid_url must be a string and is required"
                    },
                    description:{
                        bsonType:"string",
                        description:"description must be string and is required"
                    },
                    room_ids:{
                        bsonType:"array",
                        description:"rooms must be array and is optional"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    },
                    status:{
                        enum:["ACTIVE", "NOT_ACTIVE"],
                        description:"status must be ACTIVE or NOT_ACTIVE and is required"
                    },
                }
            }
        }
    })
    return result
}


//likes
async function create_likes_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.likes, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["user_id", "timestamp", "status", "last_modified", "like_type", "content_id"],
                properties:{
                    user_id:{
                        bsonType:"objectId",
                        description:"user_id must be a objectId and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    },
                    status:{
                        enum:["ACTIVE", "NOT_ACTIVE"],
                        description:"status must be ACTIVE or NOT_ACTIVE and is required"
                    },
                    like_type:{
                        enum:["ROOM_POST", "COMMENT"],
                        description:"like_type must be POST or COMMENT and is required"
                    },
                    content_id:{
                        bsonType:"objectId",
                        description:"content_id must be a objectId and is required"
                    }
                }
            }
        }
    })
    return result
}

//comments 
async function create_comments_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.comments, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["user_id", "content_id", "timestamp", "last_modified", "status", "content_type","comment_body"],
                properties:{
                    user_id:{
                        bsonType:"objectId",
                        description:"user_id must be a objectId and is required"
                    },
                    content_id:{
                        bsonType:"objectId",
                        description:"post_id must be a objectId and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    },
                    status:{
                        enum:["ACTIVE", "NOT_ACTIVE"],
                        description:"status must be ACTIVE or NOT_ACTIVE and is required"
                    },
                    content_type:{
                        enum:["ROOM_POST"],
                        description:"post_type is required"
                    },
                    comment_body:{
                        bsonType:"string",
                        description:"comment must be a string and is required"
                    }
                }
            }
        }
    })
    return result
}


module.exports={
    create_user_collection:create_user_collection,
    create_user_account_collection:create_user_account_collection,
    create_room_collection:create_room_collection,
    create_room_follow_collection:create_room_follow_collection,
    create_likes_collection:create_likes_collection,
    create_comments_collection:create_comments_collection,
    create_room_post_collection:create_room_post_collection
}