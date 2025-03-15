import { ObjectId } from "mongoose";
import { IChat, IMessage, chatModel } from "../models/chat-model";
import User from "../models/user-model";

export async function createChatBetweenUsers(userIds: ObjectId[]) {
  const existingChat = await chatModel.findOne({
    usersIds: { $all: [userIds[0], userIds[1]] },
  });

  if (existingChat == null) {
    const usersChat: IChat = {
      usersIds: userIds,
      messages: []
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
  newMessage: IMessage
) {
  const filter = { usersIds: { $all: [userId1, userId2] } };

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
  usersIds: ObjectId[]
) {
  const filter = { usersIds: { $all: usersIds } };

  const usersChat = await chatModel.findOne(filter);

  if (usersChat == null)
    return;

  let sorting_algorithm = (a: IMessage, b: IMessage) => (a.timestamp ? a.timestamp.getTime() : 0) - (b.timestamp ? b.timestamp.getTime() : 0);

  usersChat.toObject().messages = usersChat.messages.sort(sorting_algorithm);

  return usersChat;
}

export async function getGymChats(ownerId: ObjectId) {
  try {
    const chats = await chatModel.find({ usersIds: ownerId });

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