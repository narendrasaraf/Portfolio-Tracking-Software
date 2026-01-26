import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
    name: string;
    type: string;
    symbol?: string;
    platform?: string;
    quantity: number;
    investedAmount: number;
    manualPrice?: number;
    manualCurrentValue?: number;
    userId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AssetSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    symbol: { type: String },
    platform: { type: String, default: 'Unknown' },
    quantity: { type: Number, default: 0 },
    investedAmount: { type: Number, default: 0 },
    manualPrice: { type: Number },
    manualCurrentValue: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Rename _id to id
AssetSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
AssetSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

AssetSchema.virtual('transactions', {
    ref: 'AssetTransaction',
    localField: '_id',
    foreignField: 'assetId',
    options: { sort: { date: -1 } }
});

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);
