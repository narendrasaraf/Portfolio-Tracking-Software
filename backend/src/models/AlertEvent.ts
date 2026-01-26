import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertEvent extends Document {
    ruleId: mongoose.Schema.Types.ObjectId;
    triggeredAt: Date;
    message: string;
    isRead: boolean;
    userId: mongoose.Schema.Types.ObjectId;
}

const AlertEventSchema: Schema = new Schema({
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlertRule', required: true },
    triggeredAt: { type: Date, default: Date.now },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

AlertEventSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

AlertEventSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

export const AlertEvent = mongoose.model<IAlertEvent>('AlertEvent', AlertEventSchema);
