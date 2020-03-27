//TODO:

1. Major security violation:    
    You jwt only verifies whether it is valid or not. It does not make sure that someone else is takine someone else's jwt and using it for authentication. 

    In query routes, you obtain the user from thw jwt, and that is good as it makes sure that you are only returning values of the user whom the request maker is claiming to be (identified by jwt)

    But in Mutation routes you are identifying the user on the basis of user_id sent in request body. This should be changed, as anyone can use their own jwt and use someone else's user_id to mutate their data. Hence, either just stick to identification using jwt or make and extra validation by checking whether the user_id present in the input body matches with user_id resolved by jwt.