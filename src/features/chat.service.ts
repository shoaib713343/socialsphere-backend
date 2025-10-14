import { ChatMessageModel } from "./chat.model";

export const getChatHistory = async (currentUserId: string, otherUserId: string) => {
    const messages = await ChatMessageModel.find({
        $or: [
            { sender: currentUserId, receiver: otherUserId },
            { sender: otherUserId, receiver: currentUserId },
        ],
    }).sort({ createdAt: 'asc' });
    return messages;
};

export const saveChatMessage = async (messageData: {
    senderId: string;
    receiverId: string;
    content: string;
}) => {
    const newMessage = await ChatMessageModel.create({
        sender: messageData.senderId,
        receiver: messageData.receiverId,
        content: messageData.content
    });

    await newMessage.populate('sender', 'username profilePicture');

    return newMessage;
};