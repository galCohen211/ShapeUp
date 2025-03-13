import { ObjectId } from "mongoose";
import { IChat, IMessage, chatModel } from "../models/chat-model";

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
    // Find all chats where the gym owner is a participant
    const chats = await chatModel.find({ usersIds: ownerId });

    if (!chats || chats.length === 0) {
      return [];
    }

    // Extract the users who have chatted with the owner
    const chatUsers = chats
      .map((chat) => {
        const user = chat.usersIds.find((id) => id.toString() !== ownerId.toString());
        return user ? { userId: user.toString(), name: `User ${user.toString().slice(-4)}` } : null;
      })
      .filter((user) => user !== null); // Remove null values

    return chatUsers;
  } catch (error) {
    console.error("Error fetching gym chats:", error);
    return [];
  }
}