import { UserModel } from "./auth.model";
import { ChatMessageModel } from "./chat.model";

export const getChatHistory = async (currentUserId: string, otherUserId: string) => {
    const messages = await ChatMessageModel.find({
        $or: [
            { sender: currentUserId, receiver: otherUserId },
            { sender: otherUserId, receiver: currentUserId },
        ],
    }).sort({ createdAt: 'asc' })
    .populate('sender', 'username _id profilePicture');
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

    await newMessage.populate('sender', 'username _id profilePicture');

    return newMessage;
};

export const getConversations = async (currentUserId: string) => {
    const currentUser = await UserModel.findById(currentUserId).lean();
    const followingIds = currentUser?.following || [];

    const messages = await ChatMessageModel.find({
        $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    }).lean();

    const chatPartnerIds = messages.map(msg => 
        msg.sender.toString() === currentUserId ? msg.receiver.toString() : msg.sender.toString()
    );

    const allUserIds = [
        ...new Set([...followingIds.map(id => id.toString(), ...chatPartnerIds)])
    ];

    const finalUserIds = allUserIds.filter(id => id !== currentUserId);

    const conversations = await UserModel.find({
        _id: { $in: finalUserIds },
    }).select('username profilePicture _id');

    return conversations;
}