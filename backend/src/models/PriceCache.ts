import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceCache extends Document {
    key: string;
    type: string;
    symbol: string;
    priceInInr: number;
    prevPriceInInr?: number;
    userId: mongoose.Schema.Types.ObjectId;
    updatedAt: Date;
}

const PriceCacheSchema: Schema = new Schema({
    key: { type: String, required: true },
    type: { type: String, required: true },
    symbol: { type: String, required: true },
    priceInInr: { type: Number, required: true },
    prevPriceInInr: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PriceCacheSchema.index({ key: 1, userId: 1 }, { unique: true });

PriceCacheSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

PriceCacheSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

export const PriceCache = mongoose.model<IPriceCache>('PriceCache', PriceCacheSchema);
