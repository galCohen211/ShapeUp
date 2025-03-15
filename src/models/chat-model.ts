import {model, ObjectId, Schema} from "mongoose";

export interface IMessage {
  creator: ObjectId;
  text: string;
  timestamp: Date;
}

export const messageSchema = new Schema<IMessage>({
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
  usersIds: ObjectId[];
  messages: IMessage[];
  gymName: string;
}

const chatSchema = new Schema<IChat>({
  usersIds: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true
  },
  messages: [messageSchema],
  gymName: {
    type: String,
    required: true
  }
}, {versionKey: false});

export const chatModel = model<IChat>("Users-Chat", chatSchema);