import { Server as SocketIOServer, Socket } from 'socket.io';
import { createChatBetweenUsers, AddMessageToChat, getMessagesBetweenTwoUsers, getGymChats, updateGymName } from './chat-logic';
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

    socket.on("communicate", async (userId1: ObjectId, userId2: ObjectId, gymName: string, text: string) => {
      try {
        await createChatBetweenUsers([userId1, userId2], gymName);
    
        const newMessage = {
          sender: userId1,
          text: text
        };
        
        await AddMessageToChat(userId1, userId2, gymName, newMessage as IMessage);
    
        if (usersSocket[userId1.toString()]) {
          usersSocket[userId1.toString()].emit("message", newMessage);
        }
        
        if (usersSocket[userId2.toString()]) {
          usersSocket[userId2.toString()].emit("message", newMessage);
        }
    
    
      } catch (err) {
      }
    });

    socket.on("get_users_chat", async (userId1: ObjectId, userId2: ObjectId, gymName: string, callback) => {
      try {        
        const chatHistory = await getMessagesBetweenTwoUsers([userId1, userId2], gymName);
    
        if (chatHistory) {
          callback({ messages: chatHistory.messages });
        } else {
          callback({ messages: [] });
        }
      } catch (error) {
        callback({ messages: [] });
      }
    });
    
    socket.on("get_gym_chats", async (ownerId: ObjectId, gymName: string, callback) => {
      try {    
        const chatUsers = await getGymChats(ownerId, gymName);
    
        callback(chatUsers);
      } catch (error) {
        console.error("Error fetching gym chats:", error);
        callback([]);
      }
    });

    socket.on("update_gym_name", async (ownerId: ObjectId, oldGymName: string, newGymName: string, callback) => {
      try {    
        const updatedChats = await updateGymName(ownerId, oldGymName, newGymName);
    
        if (updatedChats > 0) {
          callback({ success: true, updatedChats });
        } else {
          callback({ success: false, message: "No chats found for this gym." });
        }
      } catch (error) {
        console.error("Error updating gym name:", error);
        callback({ success: false, message: "Internal server error." });
      }
    });
    

    socket.on("disconnect", () => {
      console.log(`The user was disconnected`);
    });
  });
}