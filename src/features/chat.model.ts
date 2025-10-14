import mongoose, {Schema, model, Document} from "mongoose";

export interface IChatMessage extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    content: string;
    isRead: boolean;
}

const chatMessageSchema = new Schema<IChatMessage>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
}, {timestamps: true});

export const ChatMessageModel = model<IChatMessage>('ChatMessage', chatMessageSchema);