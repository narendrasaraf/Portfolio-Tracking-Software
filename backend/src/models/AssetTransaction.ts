import mongoose, { Schema, Document } from 'mongoose';

export interface IAssetTransaction extends Document {
    assetId: mongoose.Schema.Types.ObjectId;
    type: string;
    quantity: number;
    pricePerUnit: number;
    fees: number;
    notes?: string;
    realizedProfit?: number;
    date: Date;
    userId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
}

const AssetTransactionSchema: Schema = new Schema({
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    type: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    fees: { type: Number, default: 0 },
    notes: { type: String },
    realizedProfit: { type: Number },
    date: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

AssetTransactionSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

AssetTransactionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

AssetTransactionSchema.virtual('asset', {
    ref: 'Asset',
    localField: 'assetId',
    foreignField: '_id',
    justOne: true
});

export const AssetTransaction = mongoose.model<IAssetTransaction>('AssetTransaction', AssetTransactionSchema);
