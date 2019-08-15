const MongoClient = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000);

let url = 'mongodb://url-goes-here/socketChat';

/*
* Connect to MongoDb
 */
MongoClient.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true }, function (err, db){
    if (err) throw err;
    console.log('Connected to MongoDB');

    // Set db constants
    const socketChat = db.db('socketChat');
    const users = socketChat.collection('users');
    const messages = socketChat.collection('messages');

/*
* Connect to SocketIO
 */
    io.on('connection', function (socket) {
        console.log('Connected to socket.io, ID: ' + socket.id);

        /*
        * Handle enter chat
        */
        socket.on("username", function (username) {
            console.log(username);
            
            users.find().toArray(function (err, res) {
                if (err) throw err;
                socket.emit('users', res);
            });

            messages.find().toArray(function(err, res){
                if(err) throw err;
                socket.emit('messages', res);
            });
            
            users.insertOne({socketID: socket.id, username: username});

            socket.broadcast.emit('logon', {
                socketID: socket.id,
                username: username
            });

            /*
            * handle log off
            */
            socket.on('disconnect', function () {
                console.log('User ' + socket.id + 'disconnected');

                users.deleteOne({socketID: socket.id}, function () {
                    socket.broadcast.emit('logoff', socket.id);
                })
            });

            /*
            * handle chat input
            */
            socket.on('input', function (data) {
                if(data.publicChat){
                    messages.insertOne({username: data.username, message: data.message, date: data.date});
                }

                io.emit('output', data);
            });

            /*
            * handle second user trigger
            */
            socket.on('secondUserTrigger', function (data) {
                socket.to(data.secondUserID).emit('secondUserChatWindow', data);
            });
        })
    })


});
