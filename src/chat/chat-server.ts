import { Server as SocketIOServer, Socket } from 'socket.io';
import { createChatBetweenUsers, AddMessageToChat, getMessagesBetweenTwoUsers } from './chat-logic';
import { IMessage } from '../models/chat-model';
import { ObjectId } from 'mongoose';

const usersSocket: Record<string, Socket> = {};

export function initChat(server: SocketIOServer): void {
  server.on("connection", (socket: Socket) => {
    socket.on("add_user", (userId: ObjectId) => {
      usersSocket[userId.toString()] = socket;

      console.log('User Id - ' + userId + ' was added to the chat');
    });

    socket.on("remove_user", (userId: ObjectId) => {
      delete usersSocket[userId.toString()];
      console.log('User Id - ' + userId + ' was disconnected from the chat');
    });

    socket.on("communicate", async (userId1: ObjectId, userId2: ObjectId, text: string) => {
      try {
        await createChatBetweenUsers([userId1, userId2]);
  
        const newMessage = {
          creator: userId1,
          text: text
        }
        
        await AddMessageToChat(userId1, userId2, newMessage as IMessage);

        if (usersSocket[userId2.toString()] != null) {
            usersSocket[userId2.toString()].send(newMessage);
            console.log('Sent a message to ' + userId2);
        }
      } catch (err) {
        console.log(`Error when sending a message: ${err}`);
      }
    });

    socket.on("get_users_chat", async (userId1: ObjectId, userId2: ObjectId, callback) => {
      try {
        console.log(`Fetching chat history for users: ${userId1}, ${userId2}`);
        
        const chatHistory = await getMessagesBetweenTwoUsers([userId1, userId2]);
    
        if (chatHistory) {
          console.log("Chat history found:", chatHistory.messages);
          callback({ messages: chatHistory.messages });
        } else {
          console.log("No chat history found.");
          callback({ messages: [] });
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
        callback({ messages: [] });
      }
    });
  
    socket.on("disconnect", () => {
      console.log(`The user was disconnected`);
    });
  });
}