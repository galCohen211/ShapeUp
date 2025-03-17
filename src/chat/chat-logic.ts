import { ObjectId } from "mongoose";
import { IChat, IMessage, chatModel } from "../models/chat-model";
import User from "../models/user-model";

export async function createChatBetweenUsers(userIds: ObjectId[], gymName: string) {
  const existingChat = await chatModel.findOne({
    usersIds: { $all: [userIds[0], userIds[1]] },
    gymName: gymName
  });

  if (existingChat == null) {
    const usersChat: IChat = {
      usersIds: userIds,
      messages: [],
      gymName
    };

    await chatModel.create(usersChat);

    console.log('Chat was created for user ids: ' + userIds[0] + "&" + userIds[1]);
  } else {
    console.log('Chat was already exists for user ids: ' + userIds[0] + "&" + userIds[1]);
  }
}

export async function AddMessageToChat(
  userId1: ObjectId,
  userId2: ObjectId,
  gymName: string,
  newMessage: IMessage
) {
  const filter = { usersIds: { $all: [userId1, userId2] }, gymName };

  const update = {
    $push: {
      messages: {
        $each: [newMessage],
        $position: 0
      }
    }
  };

  const options = {
    new: true,
    upsert: true
  };

  await chatModel.findOneAndUpdate(filter, update, options);
}

export async function getMessagesBetweenTwoUsers(
  usersIds: ObjectId[],
  gymName: string
) {
  const filter = { usersIds: { $all: usersIds }, gymName: gymName };

  const usersChat = await chatModel.findOne(filter);

  if (!usersChat) return null;

  usersChat.messages.sort((a: IMessage, b: IMessage) => 
    (a.timestamp ? a.timestamp.getTime() : 0) - (b.timestamp ? b.timestamp.getTime() : 0)
  );

  return usersChat;
}

export async function getGymChats(ownerId: ObjectId, gymName: string) {
  try {
    const chats = await chatModel.find({ usersIds: ownerId, gymName });

    if (!chats || chats.length === 0) {
      return [];
    }

    const chatUsers = await Promise.all(
      chats.map(async (chat) => {
        const userId = chat.usersIds.find((id) => id.toString() !== ownerId.toString());
        if (!userId) return null;
    
        const user = await User.findById(userId, "firstName lastName");
        return user ? { userId: userId.toString(), firstName: user.firstName, lastName: user.lastName } : null;
      })
    );

    return chatUsers.filter((user) => user !== null);
  } catch (error) {
    console.error("Error fetching gym chats:", error);
    return [];
  }
}

export async function updateGymName(ownerId: ObjectId, oldGymName: string, newGymName: string) {
  try {
    const result = await chatModel.updateMany(
      { usersIds: ownerId, gymName: oldGymName },
      { $set: { gymName: newGymName } }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Error updating gym name in chats:", error);
    return 0;
  }
}
