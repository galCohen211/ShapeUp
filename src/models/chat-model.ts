import {model, Schema} from "mongoose";

export interface IMessage {
  creator: string;
  text: string;
  timestamp: Date
}

export const messageSchema = new Schema<IMessage>({
  creator: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});


export interface IChat {
  usersIds: string[];
  messages: IMessage[];
}

const chatSchema = new Schema<IChat>({
  usersIds: {
    type: [String],
    required: true
  },
  messages: [messageSchema]
}, {versionKey: false});

export const chatModel = model<IChat>("Users-Chat", chatSchema);