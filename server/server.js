import express from 'express';
import cors from 'cors';
import "dotenv/config";
import http from 'http';
import { connectDB } from './lib/db.js';
import userRoutes from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

//create http server
const app = express();
const server = http.createServer(app);

//socket.io setup
export const io = new Server(server,{
    cors:{origin:"*"}
});

//store online users
export const userSocketMap = {}; //{userId:socketId}

//socket connection
io.on('connection',(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log('User connected',userId);

    if(userId){
        userSocketMap[userId] = socket.id;
    }

    //emit online users all connected users
    io.emit('getOnlineUsers',Object.keys(userSocketMap));

    socket.on('disconnect',()=>{
        console.log('User disconnected',userId);
        delete userSocketMap[userId];
        io.emit('getOnlineUsers',Object.keys(userSocketMap));
    })
});




//middlewares
app.use(express.json({limit: '4mb'}));
app.use(cors());

//routes
app.use('/api/status', (req, res)=> res.send("Server is live"));
app.use('/api/auth', userRoutes);
app.use('/api/messages',messageRouter);


//database
await connectDB();

//start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`));