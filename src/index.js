const express = require('express');
const path = require("path");
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocation} = require('../src/utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')
const port = process.env.PORT || 3000;

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket)=>{
    console.log('new web socket connection started!')

    socket.on('join', ({username, room}, callback)=>{
        const {error, user} = addUser({id:socket.id, username, room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id);
        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation', (coords, callback)=>{
        const user = getUser(socket.id)
        const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        io.to(user.room).emit('locationMessage', generateLocation(user.username, url));
        callback()
    })
})

server.listen(port, ()=>{
    console.log(`server is up on port ${port}`)
})