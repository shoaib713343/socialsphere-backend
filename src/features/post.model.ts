import mongoose, {Schema, model, Document} from 'mongoose';
import './auth.model';  

interface IComment {
  author: mongoose.Schema.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document{
    content: string;
    author: mongoose.Schema.Types.ObjectId;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    likes: mongoose.Schema.Types.ObjectId[];
    comments: IComment[];
}

const postSchema = new Schema<IPost>({
     content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
     author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video']
    },
    likes: {
  type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  default: [],
},
     comments: {
      type: [
        {
          author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          text: { type: String, required: true, maxlength: 200 },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
}, { timestamps: true });

export const PostModel = model<IPost>('Post', postSchema);