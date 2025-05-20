import { Server as SocketIOServer, Socket } from 'socket.io';
import { createChatBetweenUsers, AddMessageToChat, getMessagesBetweenTwoUsers, getGymChats, updateGymName } from './chat-logic';
import { IMessage } from '../models/chat-model';
import Gym from '../models/gym-model';
import { chatModel } from '../models/chat-model';
import { ObjectId } from 'mongoose';

const usersSocket: Record<string, Socket> = {};

export function initChat(server: SocketIOServer): void {
  server.on("connection", (socket: Socket) => {
    socket.on("add_user", (userId: ObjectId) => {
      if (userId != null) {
        usersSocket[userId.toString()] = socket;
      }
    });

    socket.on("remove_user", (userId: ObjectId) => {
      if (userId != null) {
        delete usersSocket[userId.toString()];
      }
    });

    socket.on("communicate", async (userId1: ObjectId, userId2: ObjectId, gymName: string, text: string) => {
      try {
        await createChatBetweenUsers([userId1, userId2], gymName);
        const gym = await Gym.findOne({ name: gymName });
        const gymId = gym?._id;

        const newMessage = {
          sender: userId1,
          text: text,
          timestamp: new Date(),
          gymId,
          readBy: [userId1]
        };

        await AddMessageToChat(userId1, userId2, gymName, newMessage as IMessage);

        const receiverSocket = usersSocket[userId2.toString()];
        if (receiverSocket) {
          receiverSocket.emit("message", newMessage);
        }

      } catch (err) {
        console.error("Error sending message", err);
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
          callback({ success: true, message: "No chats found for this gym." });
        }
      } catch (error) {
        console.error("Error updating gym name:", error);
        callback({ success: false, message: "Internal server error." });
      }
    });

    socket.on("mark_as_read", async (userId: ObjectId, userId2: ObjectId, gymName: string) => {
      try {
        const result = await chatModel.updateOne(
          { usersIds: { $all: [userId, userId2] }, gymName },
          {
            $addToSet: {
              "messages.$[elem].readBy": userId
            }
          },
          {
            arrayFilters: [
              {
                "elem.sender": { $ne: userId },
                "elem.readBy": { $ne: userId }
              }
            ],
            multi: true
          }
        );
    
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    });
    

    socket.on("get_unread_count", async (userId: ObjectId, gymId: ObjectId, gymName: string, callback) => {
      try {
        const chat = await chatModel.findOne({
          usersIds: userId,
          gymName
        });
    
        if (!chat) return callback(0);
    
        const unread = chat.messages.filter(msg => {
          const isNotSender = msg.sender.toString() !== userId.toString();
          const hasNotRead = !(msg.readBy ?? []).map(id => id.toString()).includes(userId.toString());
          return isNotSender && hasNotRead;
        });
        callback(unread.length);
      } catch (err) {
        console.error("Error getting unread count:", err);
        callback(0);
      }
    });
    
    socket.on("disconnect", () => {
      console.log(`The user was disconnected`);
    });
  });
}