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
                required:["user_id", "age", "username", "timestamp", "last_modified", "name", "default_avatar"],
                properties:{
                    user_id:{
                        bsonType:"objectId",
                        description:"user_id must be a objectId and is required"
                    },
                    age:{
                        bsonType:"int",
                        description:"age must be integer and is required"
                    },
                    username:{
                        bsonType:"string",
                        description:"username must be a string and is required"
                    },
                    avatar:{
                        bsonType:"objectId",
                        description:"avatar must be objectId and is optional"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be a date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be a date(ISODate) and is required"
                    },
                    name:{
                        bsonType:"string",
                        description:"name must be string and is required"
                    },
                    three_words:{
                        bsonType:"string",
                        description:"three_words must be string and is optional"
                    }, 
                    bio:{
                        bsonType:"string",
                        description:"description must be string and is optional"
                    },
                    default_avatar:{
                        bsonType:"bool",
                        description:"default_avatar is boolean and is required"
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
                    },
                    description:{
                        bsonType:"string",
                        description:"description must be a string and is required"
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
                required:["creator_id", "timestamp", "last_modified", "room_ids", "post_type", "status", "description"],
                properties:{
                    creator_id:{
                        bsonType:"objectId",
                        description:"creator_id must be a objectId and is required"
                    },
                    image:{
                        bsonType:"objectId",
                        description:"image must be a objectId and is optional"
                    },
                    description:{
                        bsonType:"string",
                        description:"description must be string and is optional"
                    },
                    room_ids:{
                        bsonType:"array",
                        description:"rooms must be array and is required"
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
                    post_type:{
                        enum:["ROOM_POST", "ROOM_CAPTION_POST"],
                        description:"post_type must be ROOM_POST and is required"
                    }

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
                required:["user_id", "timestamp", "status", "last_modified", "content_id"],
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


//images
async function create_images_collection(main_db){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.images, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["image_name", "width", "height", "timestamp", "last_modified", "status"],
                properties:{
                    image_name:{
                        bsonType:"string",
                        description:"image_id must be a string and is required"
                    },
                    width:{
                        bsonType:"int",
                        description:"width must be int and is required"
                    },
                    height:{
                        bsonType:"int",
                        description:"height must be int and is required"
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
                    }
                }
            }
        }  
    })
    return result
}

//room_post_caption
async function create_captions_collection(){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.captions, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["post_id", "creator_id", "timestamp", "last_modified", "status", "description"],
                properties:{
                    post_id:{
                        bsonType:"objectId",
                        description:"post_id must be a objectId and is required"
                    },
                    creator_id:{
                        bsonType:"objectId",
                        description:"creator_id must be a objectId and is required"
                    },
                    description:{
                        bsonType:"string",
                        description:"description must be string and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be date(ISODate) and is required"
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


//up_vote
async function create_votes_collection(){
    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.votes, {
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["content_id", "creator_id", "timestamp", "last_modified", "status", "vote_type"],
                properties:{
                    content_id:{
                        bsonType:"objectId",
                        description:"content_id must be a objectId and is required"
                    },
                    creator_id:{
                        bsonType:"objectId",
                        description:"creator_id must be a objectId and is required"
                    },
                    timestamp:{
                        bsonType:"date",
                        description:"timestamp must be date(ISODate) and is required"
                    },
                    last_modified:{
                        bsonType:"date",
                        description:"last_modified must be date(ISODate) and is required"
                    },
                    status:{
                        enum:["ACTIVE", "NOT_ACTIVE"],
                        description:"status must be ACTIVE or NOT_ACTIVE and is required"
                    },
                    vote_type:{
                        enum:["UP", "DOWN"],
                        description:"vote must be UP or DOWN and is required"
                    },
                    content_type:{
                        enum:["CAPTION"],
                        description:"vote must be CAPTION and is required"
                    }
                }
            }
        }  
    })
}

//password_recovery_code
async function create_password_recovery_codes_collection() {

    var result = await db_structure.main_db.db_instance.createCollection(db_structure.main_db.collections.password_recovery_codes,{
        validator:{
            $jsonSchema:{
                bsonType:"object",
                required:["createdAt", "user_id"],
                properties:{
                    createdAt:{
                        bsonType:"date",
                        description:"createdAt must be a date(ISODate) and is required"
                    },
                    user_id:{
                        bsonType:"objectId",
                        description:"user_id must be a objectId and is required"
                    },
                    verification_code:{
                        bsonType:"string",
                        description:"verification_code must be a string and is required"
                    }
                }
            }
        }
    })

}

module.exports={
    create_user_collection:create_user_collection,
    create_user_account_collection:create_user_account_collection,
    create_room_collection:create_room_collection,
    create_room_follow_collection:create_room_follow_collection,
    create_likes_collection:create_likes_collection,
    create_comments_collection:create_comments_collection,
    create_room_post_collection:create_room_post_collection,
    create_images_collection:create_images_collection,
    create_captions_collection:create_captions_collection,
    create_votes_collection:create_votes_collection,
    create_password_recovery_codes_collection
}