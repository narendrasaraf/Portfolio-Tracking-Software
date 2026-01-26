import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertRule extends Document {
    type: string;
    enabled: boolean;
    assetId?: mongoose.Schema.Types.ObjectId;
    assetType?: string;
    direction: string;
    thresholdValue?: number;
    thresholdPercent?: number;
    userId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
}

const AlertRuleSchema: Schema = new Schema({
    type: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    assetType: { type: String },
    direction: { type: String, required: true },
    thresholdValue: { type: Number },
    thresholdPercent: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

AlertRuleSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

AlertRuleSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

AlertRuleSchema.virtual('events', {
    ref: 'AlertEvent',
    localField: '_id',
    foreignField: 'ruleId'
});

export const AlertRule = mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
