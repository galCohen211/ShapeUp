import { IChat, IMessage, chatModel } from "../models/chat-model";

export async function createChatBetweenUsers(userId1: string, userId2: string) {
  const existingChat = await chatModel.findOne({
    usersIds: { $all: [userId1, userId2] },
  });

  if (existingChat == null) {
    const usersChat: IChat = {
      usersIds: [userId1, userId2],
      messages: []
    };

    await chatModel.create(usersChat);

    console.log('Chat was created for user ids: ' + userId1 + "&" + userId2);
  } else {
    console.log('Chat was already exists for user ids: ' + userId1 + "&" + userId2);
  }
}

export async function AddMessageToChat(
  userId1: string,
  userId2: string,
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

  console.log('New message was added to the chat');      
}

export async function getMessagesBetweenTwoUsers(
  usersIds: string[]
) {
  const filter = { usersIds: { $all: usersIds } };

  const usersChat = await chatModel.findOne(filter);

  if (usersChat == null)
    return;

  let sorting_algorithm = (a: IMessage, b: IMessage) => (a.timestamp ? a.timestamp.getTime() : 0) - (b.timestamp ? b.timestamp.getTime() : 0);

  usersChat.toObject().messages = usersChat.messages.sort(sorting_algorithm);

  return usersChat;
}
