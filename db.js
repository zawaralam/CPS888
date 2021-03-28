var { MongoClient } = require("mongodb");
var bcrypt = require("bcrypt");
var url = 'mongodb+srv://dbUser:cps888project@cluster0.pxcu4.mongodb.net/cps888?retryWrites=true&w=majority';

if(process.env.TEST){
    url = 'mongodb+srv://dbUser:cps888project@cluster0.pxcu4.mongodb.net/cps888-test?retryWrites=true&w=majority';
}

var db = null;
var client = null;
async function connect(){
    if(db == null){
        var options = {
            useUnifiedTopology: true,
        };
        var client = await MongoClient.connect(url, options);
        db = client.db("cps888");
    }
    return db;
}

async function register(username, password,firstname,lastname){
    var conn = await connect();
    var existingUser = await conn.collection('users').findOne({username});

    if(existingUser != null){
        throw new Error('User already exists');
    }

    var SALT_ROUNDS = 10;
    var passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await conn.collection('users').insertOne({username, passwordHash,firstname, lastname});
}

async function login(username, password){
    var conn = await connect();
    var user = await conn.collection('users').findOne({username});

    if(user == null){
        throw new Error('User does not exist');
    }

    var valid = await bcrypt.compare(password, user.passwordHash);
    
    if(!valid){
        throw new Error("Invalid password");
    }
    console.log("Login successful");
}

async function addSpendingCategory(username, SpendingCategory){
    var conn = await connect();

    await conn.collection('users').updateOne(
        {username},
        {
            $push: {
                transactions: SpendingCategory,
            }
        }
    )
}
async function addTransactionCost(username,Cost){
    var conn = await connect();

    await conn.collection('users').updateOne(
        {username},
        {
            $push: {
                transactions: Cost,
            }
        }
    )
}
async function getTransaction(username){
    var conn = await connect();
    var user = await conn.collection('users').findOne({username});

    return user.transactions;
}

async function deleteTransactionItem(username, Cost){
    var conn = await connect();
    await conn.collection('users').updateOne(
        {username},
        {
            $pull: {
                transactions: Cost,
            }
        }
    )
}

async function close(){
    await client.close();
}

module.exports = {
    url,
    login,
    register,
    deleteTransactionItem,
    getTransaction,
    addTransactionCost,
    addSpendingCategory,
    close,
};

async function wipe(){
    var conn = await connect();
    await conn.collection("users").drop();
}

if(process.env.TEST){
    module.exports.wipe = wipe;
}