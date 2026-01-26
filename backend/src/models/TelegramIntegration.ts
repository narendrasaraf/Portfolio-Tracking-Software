import mongoose, { Schema, Document } from 'mongoose';

export interface ITelegramIntegration extends Document {
    chatId: string;
    userId: mongoose.Schema.Types.ObjectId;
    enabled: boolean;
    createdAt: Date;
}

const TelegramIntegrationSchema: Schema = new Schema({
    chatId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

TelegramIntegrationSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

TelegramIntegrationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

export const TelegramIntegration = mongoose.model<ITelegramIntegration>('TelegramIntegration', TelegramIntegrationSchema);
