const bcrypt = require("bcrypt")
const jsonwebtoken = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")
const {AuthenticationError} = require("apollo-server-express")

//importing PRIV_KEY
const path_to_priv_key = path.join(__dirname, "../../", "id_rsa_priv.pem")
const PRIV_KEY = fs.readFileSync(path_to_priv_key, "utf-8")
//importing PUB_KEY
const path_to_pub_key = path.join(__dirname, "../../", "id_rsa_pub.pem")
const PUB_KEY = fs.readFileSync(path_to_pub_key, "utf-8")

async function generate_password_hash(password){

    try{
        hash = await bcrypt.hash(password, 10)
        return hash
    }catch(e){
        throw Error(e)
    }
    
}

async function verify_password_hash(hash, password){
    
    try{
        result = await bcrypt.compare(password, hash)
        return result
    }catch(e){
        throw Error(e)
    }

}

async function issue_jwt(user){

    const _id = user._id

    //days to expire
    const expires_in = "10d"

    const payload = {
        sub:_id,
        iat:Date.now()
    }

    const signed_jwt = jsonwebtoken.sign(payload, PRIV_KEY, {expiresIn: expires_in, algorithm: "RS256"})

    return `Bearer ${signed_jwt}`
}

async function verify_jwt(jwt){

    const token = jwt.split(" ")[1]

    if (!token){
        throw new AuthenticationError(`JWT should in format "Bearer [token]"`)
    }

    jsonwebtoken.verify(jwt, PUB_KEY, {ignoreExpiration:true, algorithms:["RS256"]}, (err, payload)=>{
        
        if (err.name === "TokenExpiredError"){
            throw new AuthenticationError("Token Expired")
        }

        if (err.name === "JsonWebTokenError"){ 
            throw new AuthenticationError("JWT malformed")
        }
        
        return payload.sub

    })


}


module.exports = {
    generate_password_hash:generate_password_hash,
    verify_password_hash:verify_password_hash,
    issue_jwt,
    verify_jwt
}