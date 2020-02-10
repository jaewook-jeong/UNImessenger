var express = require('express'); // 서버를 위한 express 모듈 가져오기 
var path = require('path'); // 
var app = express(); // express 서버 정의 
var server = require('http').Server(app);
var io = require('socket.io')(server);

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/unidb', { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log("open: success");
});
var userSchema = mongoose.Schema({
    id: 'string',
    message: 'string'
});
var Chat = mongoose.model('Chat', userSchema);


app.use(express.static(__dirname));

app.get("/", function (req, res, next) { // express 서버의 / (root 경로) 에 request가 들어오면, 
    res.sendFile(path.join(__dirname, 'chat.html')); // response로 "chat.html" 를 전송 
})

io.on('connection', function (socket) { //socket.io 연결 시에, 해당 연결에 대해서 

    socket.on('chat', function (data) { // chat이라는게 들어오면, 매개변수 data를 아래와 같이 처리한다. 
        io.emit('chat', data); //접속한 모든 이에게 data를 전송 
        var db_insert = new Chat({ id: data.id, message: data.message });
        db_insert.save(function (err, data) {
            if (err) {// TODO handle the error
                console.log("error");
            }
            console.log('message is inserted');
        });
        return;
    })

    socket.on('login', function (data) { // login이라는게 들어오면, 매개변수 data를 아래와 같이 처리한다. 
        socket.broadcast.emit('chat', data); //나를 제외한 접속한 모든 이에게 로그인함을 전송
        Chat.find(function (err, result) {
            for (var i = 0; i < result.length; i++) {
                var dbData = { id: result[i].id, message: result[i].message };
                socket.emit('preload', dbData);
            }
        });
    })
})

server.listen(3000, function () { //서버를 listen 상태로 대기시킴 
    console.log("Server is running on port 3000..."); //서버가 실행되면 로그가 실행
});