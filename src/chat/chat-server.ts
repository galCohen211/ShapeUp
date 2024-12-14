import { Server as SocketIOServer, Socket } from 'socket.io';
import { createChatBetweenUsers, AddMessageToChat } from './chat-logic';
import { IMessage } from '../models/chat-model';

const usersSocket: Record<string, Socket> = {};

export function initChat(server: SocketIOServer): void {
  server.on("connection", (socket: Socket) => {
    socket.on("add_user", (userId: string) => {
      usersSocket[userId] = socket;

      console.log('User Id - ' + userId + ' was added to the chat');
    });

    socket.on("remove_user", (userId: string) => {
      delete usersSocket[userId];
      console.log('User Id - ' + userId + ' was disconnected from the chat');
    });

    socket.on("communicate", async (userId1: string, userId2: string, text: string) => {
      try {
        await createChatBetweenUsers(userId1, userId2);
  
        const newMessage = {
          creator: userId1,
          text: text
        }
        
        await AddMessageToChat(userId1, userId2, newMessage as IMessage);

        if (usersSocket[userId1] != null) {
            usersSocket[userId1].send(newMessage);
            console.log('Sent a message to ' + userId1);      
        }

        if (usersSocket[userId2] != null) {
            usersSocket[userId1].send(newMessage);
            console.log('Sent a message to ' + userId2);
        }
      } catch (err) {
        console.log(`Error when sending a message: ${err}`);
      }
    });
  
    socket.on("disconnect", () => {
      console.log(`The user was disconnected`);
    });
  });
}